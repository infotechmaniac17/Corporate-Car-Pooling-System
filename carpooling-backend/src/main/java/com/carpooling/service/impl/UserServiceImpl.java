
package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.request.LoginRequest;
import com.carpooling.dto.request.RegisterRequest;
import com.carpooling.dto.response.AuthResponse;
import com.carpooling.dto.response.UserResponse;
import com.carpooling.entity.Organisation;
import com.carpooling.entity.User;
import com.carpooling.repository.OrganisationRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.EmailVerificationService;
import com.carpooling.service.UserService;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserServiceImpl implements UserService, UserDetailsService {

    private final UserRepository userRepository;
    private final OrganisationRepository organisationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailVerificationService emailVerificationService;

    public UserServiceImpl(UserRepository userRepository,
                           OrganisationRepository organisationRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil,
                           @Lazy AuthenticationManager authenticationManager,
                           EmailVerificationService emailVerificationService) {
        this.userRepository = userRepository;
        this.organisationRepository = organisationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.emailVerificationService = emailVerificationService;
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
    public void softDeleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setIsDeleted(true);
        user.setIsOnline(false);
        userRepository.save(user);
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
