import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashPassword {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "AaiBaba@01";
        String hash = encoder.encode(password);
        System.out.println(hash);
    }
}
