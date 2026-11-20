package com.mercadotrust.backend.security;

import com.mercadotrust.backend.entity.Usuario;
import com.mercadotrust.backend.repository.UsuarioRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public CustomUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String correo) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con correo: " + correo));

        String rol = usuario.getRol();
        if (!rol.startsWith("ROLE_")) {
            rol = "ROLE_" + rol;
        }

        boolean enabled = !"INACTIVO".equalsIgnoreCase(usuario.getEstado()) && !"SUSPENDIDO".equalsIgnoreCase(usuario.getEstado());

        return new User(
                usuario.getCorreo(),
                usuario.getPasswordHash(),
                enabled,
                true,
                true,
                true,
                Collections.singletonList(new SimpleGrantedAuthority(rol))
        );
    }
}
