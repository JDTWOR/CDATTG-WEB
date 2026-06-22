-- Tablas de elecciones de representante de aprendices (regional).
-- GORM AutoMigrate también las crea; este script documenta el esquema.

-- eleccion_procesos, eleccion_planchas, eleccion_votos, eleccion_resultados, representantes_aprendiz
-- Unicidad: un ciclo por (regional_id, anio) — índice uk_eleccion_regional_anio vía GORM AutoMigrate.
