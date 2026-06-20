package dto

type ConfiguracionAsistenciaResponse struct {
	PlazoEdicionObservacionesDias int `json:"plazo_edicion_observaciones_dias"`
	IntervaloAutoCierreMinutos    int `json:"intervalo_auto_cierre_minutos"`
	MinutosAlertaSinSesion        int `json:"minutos_alerta_sin_sesion"`
	MinutosExtensionDefault       int `json:"minutos_extension_default"`
}

type ConfiguracionAsistenciaUpdateRequest struct {
	PlazoEdicionObservacionesDias int `json:"plazo_edicion_observaciones_dias" binding:"required,min=1,max=365"`
	IntervaloAutoCierreMinutos    int `json:"intervalo_auto_cierre_minutos" binding:"required,min=1,max=1440"`
	MinutosAlertaSinSesion        int `json:"minutos_alerta_sin_sesion" binding:"required,min=1,max=1440"`
	MinutosExtensionDefault       int `json:"minutos_extension_default" binding:"required,min=0,max=480"`
}
