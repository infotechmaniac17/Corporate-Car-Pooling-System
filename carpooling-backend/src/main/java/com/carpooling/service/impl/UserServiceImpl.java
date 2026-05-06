
package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.request.LoginRequest;
import com.carpooling.dto.request.RegisterRequest;
import com.carpooling.dto.request.UpdateUserRequest;
import com.carpooling.dto.response.AuthResponse;
import com.carpooling.dto.response.ProfileStatsResponse;
import com.carpooling.dto.response.UserResponse;
import com.carpooling.entity.Organisation;
import com.carpooling.entity.User;
import com.carpooling.enums.PassengerStatus;
import com.carpooling.enums.ScheduleStatus;
import com.carpooling.repository.OrganisationRepository;
import com.carpooling.repository.RidePassengerRepository;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.EmailService;
import com.carpooling.service.EmailVerificationService;
import com.carpooling.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserServiceImpl implements UserService, UserDetailsService {

    private final UserRepository userRepository;
    private final OrganisationRepository organisationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailVerificationService emailVerificationService;
    private final EmailService emailService;
    private final RidePassengerRepository ridePassengerRepository;
    private final RideScheduleRepository rideScheduleRepository;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    private record ResetEntry(String email, Instant expiry) {}
    private final ConcurrentHashMap<String, ResetEntry> resetTokens = new ConcurrentHashMap<>();

    public UserServiceImpl(UserRepository userRepository,
                           OrganisationRepository organisationRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil,
                           @Lazy AuthenticationManager authenticationManager,
                           EmailVerificationService emailVerificationService,
                           EmailService emailService,
                           RidePassengerRepository ridePassengerRepository,
                           RideScheduleRepository rideScheduleRepository) {
        this.userRepository = userRepository;
        this.organisationRepository = organisationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.emailVerificationService = emailVerificationService;
        this.emailService = emailService;
        this.ridePassengerRepository = ridePassengerRepository;
        this.rideScheduleRepository = rideScheduleRepository;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();

        emailVerificationService.verifyOtp(email, request.getOtp());

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("Email already registered");
        }
        Organisation org = organisationRepository.findById(request.getOrganisationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organisation", request.getOrganisationId()));

        boolean registeringAsDriver = request.getRole() == com.carpooling.enums.UserRole.DRIVER;

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .phone(request.getPhone().trim())
                .gender(request.getGender())
                .role(com.carpooling.enums.UserRole.PASSENGER)
                .organisation(org)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .driverStatus(registeringAsDriver
                        ? com.carpooling.enums.VerificationStatus.PENDING
                        : com.carpooling.enums.VerificationStatus.NONE)
                .passengerStatus(com.carpooling.enums.VerificationStatus.APPROVED)
                .build();
        user = userRepository.save(user);

        emailVerificationService.consumeVerifiedOtp(email);

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole().name(),
                user.getDriverStatus().name(), user.getPassengerStatus().name());
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (user.getRole() == com.carpooling.enums.UserRole.BOTH) {
            // Don't issue a real JWT yet — return a flag so frontend shows role selector
            AuthResponse response = new AuthResponse();
            response.setUserId(user.getId());
            response.setEmail(user.getEmail());
            response.setRole("BOTH");
            response.setRequiresRoleSelection(true);
            return response;
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        AuthResponse response = new AuthResponse(token, user.getId(), user.getEmail(), user.getRole().name(),
                user.getDriverStatus().name(), user.getPassengerStatus().name());
        return response;
    }

    @Override
    public AuthResponse selectRole(Long userId, String selectedRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (user.getRole() != com.carpooling.enums.UserRole.BOTH) {
            throw new com.carpooling.common.exception.BusinessException("User does not have multiple roles");
        }
        if (!selectedRole.equals("DRIVER") && !selectedRole.equals("PASSENGER")) {
            throw new com.carpooling.common.exception.BusinessException("Invalid role selection");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), selectedRole);
        return new AuthResponse(token, user.getId(), user.getEmail(), selectedRole);
    }

    @Override
    public UserResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new ResourceNotFoundException("User", userId);
        }
        return toResponse(user);
    }

    @Override
    public List<UserResponse> getUsersByOrganisation(Long organisationId) {
        return userRepository.findByOrganisationIdAndIsDeletedFalse(organisationId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public UserResponse toggleOnlineStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setIsOnline(!user.getIsOnline());
        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new ResourceNotFoundException("User", userId);
        }
        user.setName(request.getName().trim());
        user.setPhone(request.getPhone().trim());
        user.setGender(request.getGender());
        return toResponse(userRepository.save(user));
    }

    @Override
    public ProfileStatsResponse getProfileStats(Long userId) {
        return ProfileStatsResponse.builder()
                .totalRidesTaken(ridePassengerRepository.countByPassengerId(userId))
                .completedRidesAsPassenger(ridePassengerRepository.countByPassengerIdAndStatus(userId, PassengerStatus.COMPLETED))
                .cancelledRidesAsPassenger(ridePassengerRepository.countByPassengerIdAndStatus(userId, PassengerStatus.CANCELLED))
                .totalRidesOffered(rideScheduleRepository.countByDriverId(userId))
                .completedRidesAsDriver(rideScheduleRepository.countByDriverIdAndStatus(userId, ScheduleStatus.COMPLETED))
                .cancelledRidesAsDriver(rideScheduleRepository.countByDriverIdAndStatus(userId, ScheduleStatus.CANCELLED))
                .totalPassengersServed(ridePassengerRepository.countPassengersServedByDriver(userId))
                .build();
    }

    @Override
    @Transactional
    public void softDeleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setIsDeleted(true);
        user.setIsOnline(false);
        userRepository.save(user);
    }

    @Override
    public void forgotPassword(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase();
        if (!userRepository.existsByEmail(normalized)) {
            throw new BusinessException("No account found with that email address", HttpStatus.NOT_FOUND);
        }
        // Invalidate any existing token for this email
        resetTokens.entrySet().removeIf(e -> e.getValue().email().equals(normalized));

        String token = UUID.randomUUID().toString();
        resetTokens.put(token, new ResetEntry(normalized, Instant.now().plusSeconds(900)));

        String resetLink = baseUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(normalized, resetLink);
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        ResetEntry entry = resetTokens.get(token);
        if (entry == null || Instant.now().isAfter(entry.expiry())) {
            resetTokens.remove(token);
            throw new BusinessException("Reset link is invalid or has expired", HttpStatus.BAD_REQUEST);
        }
        User user = userRepository.findByEmailAndIsDeletedFalse(entry.email())
                .orElseThrow(() -> new BusinessException("Account not found", HttpStatus.NOT_FOUND));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        resetTokens.remove(token);
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .build();
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .gender(user.getGender())
                .role(user.getRole().name())
                .rating(user.getRating())
                .organisationId(user.getOrganisation().getId())
                .organisationName(user.getOrganisation().getName())
                .isOnline(user.getIsOnline())
                .driverStatus(user.getDriverStatus() != null ? user.getDriverStatus().name() : "NONE")
                .passengerStatus(user.getPassengerStatus() != null ? user.getPassengerStatus().name() : "NONE")
                .build();
    }
}
