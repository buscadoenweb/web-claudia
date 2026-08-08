-- MIGRACIÓN DE ESTADOS DE APROBACIÓN
-- Ejecutar UNA SOLA VEZ en Supabase > SQL Editor, antes o después de publicar esta versión.
-- No crea tablas ni modifica contraseñas. Copia el estado existente a app_metadata.

UPDATE auth.users
SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
        'estado',
        COALESCE(raw_user_meta_data->>'estado', 'pendiente')
    );
