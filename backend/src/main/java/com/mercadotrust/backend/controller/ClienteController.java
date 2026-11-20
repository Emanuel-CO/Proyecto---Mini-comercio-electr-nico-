package com.mercadotrust.backend.controller;

import com.mercadotrust.backend.dto.ClienteUpdateDto;
import com.mercadotrust.backend.entity.Usuario;
import com.mercadotrust.backend.repository.UsuarioRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@Tag(name = "Clientes", description = "Gestión de perfil de clientes y administración de usuarios")
@SecurityRequirement(name = "BearerAuth")
public class ClienteController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public ClienteController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/api/clientes/perfil")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN')")
    @Operation(summary = "Obtener perfil del cliente autenticado")
    public ResponseEntity<?> obtenerPerfil(Authentication authentication) {
        String correo = authentication.getName();
        return usuarioRepository.findByCorreo(correo)
                .map(u -> {
                    Map<String, Object> resp = new HashMap<>();
                    resp.put("id", u.getId());
                    resp.put("rol", u.getRol());
                    resp.put("nombresCompletos", u.getNombresCompletos());
                    resp.put("correo", u.getCorreo());
                    resp.put("telefono", u.getTelefono());
                    resp.put("direccionEnvio", u.getDireccionEnvio());
                    resp.put("estado", u.getEstado());
                    resp.put("createdAt", u.getCreatedAt());
                    return ResponseEntity.ok(resp);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/api/clientes/perfil")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN')")
    @Operation(summary = "Actualizar información del perfil y/o contraseña")
    public ResponseEntity<?> actualizarPerfil(
            @Valid @RequestBody ClienteUpdateDto dto,
            Authentication authentication
    ) {
        String correo = authentication.getName();
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setNombresCompletos(dto.getNombresCompletos());
        usuario.setTelefono(dto.getTelefono());
        usuario.setDireccionEnvio(dto.getDireccionEnvio());

        if (dto.getPasswordNueva() != null && !dto.getPasswordNueva().isBlank()) {
            if (dto.getPasswordActual() == null || dto.getPasswordActual().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Debe proporcionar su contraseña actual para cambiarla"));
            }
            if (!passwordEncoder.matches(dto.getPasswordActual(), usuario.getPasswordHash())) {
                return ResponseEntity.badRequest().body(Map.of("error", "La contraseña actual es incorrecta"));
            }
            usuario.setPasswordHash(passwordEncoder.encode(dto.getPasswordNueva()));
        }

        Usuario guardado = usuarioRepository.save(usuario);

        Map<String, Object> resp = new HashMap<>();
        resp.put("mensaje", "Perfil actualizado con éxito");
        resp.put("id", guardado.getId());
        resp.put("nombresCompletos", guardado.getNombresCompletos());
        resp.put("telefono", guardado.getTelefono());
        resp.put("direccionEnvio", guardado.getDireccionEnvio());

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/api/admin/clientes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar todos los clientes y usuarios (Solo Admin)")
    public ResponseEntity<List<Usuario>> listarTodosLosClientes() {
        return ResponseEntity.ok(usuarioRepository.findAll());
    }

    @PutMapping("/api/admin/clientes/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cambiar estado de un usuario (Solo Admin)")
    public ResponseEntity<?> cambiarEstadoUsuario(@PathVariable Integer id, @RequestParam String estado) {
        return usuarioRepository.findById(id)
                .map(u -> {
                    u.setEstado(estado.toUpperCase());
                    usuarioRepository.save(u);
                    return ResponseEntity.ok(Map.of("mensaje", "Estado actualizado", "usuarioId", id, "nuevoEstado", u.getEstado()));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
