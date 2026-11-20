package com.mercadotrust.backend.controller;

import com.mercadotrust.backend.dto.AuthRequest;
import com.mercadotrust.backend.dto.AuthResponse;
import com.mercadotrust.backend.dto.RegisterRequest;
import com.mercadotrust.backend.entity.Usuario;
import com.mercadotrust.backend.repository.UsuarioRepository;
import com.mercadotrust.backend.security.CustomUserDetailsService;
import com.mercadotrust.backend.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticación", description = "Endpoints públicos de registro, login y verificación JWT")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public AuthController(
            AuthenticationManager authenticationManager,
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CustomUserDetailsService userDetailsService
    ) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping("/register")
    @Operation(summary = "Registrar nuevo cliente en la plataforma")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Ya existe un usuario registrado con este correo"));
        }

        Usuario usuario = new Usuario();
        usuario.setNombresCompletos(request.getNombresCompletos());
        usuario.setCorreo(request.getCorreo().trim().toLowerCase());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setTelefono(request.getTelefono());
        usuario.setDireccionEnvio(request.getDireccionEnvio());
        usuario.setAceptaPoliticaDatos(request.getAceptaPoliticaDatos() != null ? request.getAceptaPoliticaDatos() : true);
        
        // Asignar rol (por defecto CLIENTE, o ADMIN si se especifica)
        String rol = (request.getRol() != null && request.getRol().equalsIgnoreCase("ADMIN")) ? "ADMIN" : "CLIENTE";
        usuario.setRol(rol);
        usuario.setEstado("ACTIVO");

        Usuario guardado = usuarioRepository.save(usuario);
        UserDetails userDetails = userDetailsService.loadUserByUsername(guardado.getCorreo());
        String token = jwtService.generateToken(userDetails, guardado.getRol(), guardado.getId());

        AuthResponse response = new AuthResponse(
                token,
                guardado.getId(),
                guardado.getCorreo(),
                guardado.getNombresCompletos(),
                guardado.getRol()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión y obtener token JWT")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getCorreo().trim().toLowerCase(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Credenciales inválidas. Correo o contraseña incorrectos."));
        }

        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo().trim().toLowerCase())
                .orElseThrow();

        UserDetails userDetails = userDetailsService.loadUserByUsername(usuario.getCorreo());
        String token = jwtService.generateToken(userDetails, usuario.getRol(), usuario.getId());

        AuthResponse response = new AuthResponse(
                token,
                usuario.getId(),
                usuario.getCorreo(),
                usuario.getNombresCompletos(),
                usuario.getRol()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener datos del usuario autenticado actual")
    public ResponseEntity<?> getMe() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No autenticado"));
        }

        String correo = auth.getName();
        return usuarioRepository.findByCorreo(correo)
                .map(u -> ResponseEntity.ok(Map.of(
                        "id", u.getId(),
                        "nombresCompletos", u.getNombresCompletos(),
                        "correo", u.getCorreo(),
                        "rol", u.getRol(),
                        "telefono", u.getTelefono() != null ? u.getTelefono() : "",
                        "direccionEnvio", u.getDireccionEnvio() != null ? u.getDireccionEnvio() : "",
                        "estado", u.getEstado()
                )))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
