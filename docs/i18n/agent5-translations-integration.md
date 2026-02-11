# SAMPLE TRANSLATIONS & INTEGRATION ARCHITECTURE: Focus Mode - Blocker
## Agent 5 — Complete P1 Locale Translations (es, de, ja, fr, pt_BR), Integration Architecture & Migration Guide

> **Date:** February 11, 2026 | **Status:** Complete
> **Phase:** 15 — Internationalization System
> **Input:** Agent 1 (en/messages.json master key list), Agent 2 (translation workflow), Agent 3 (locale formatting), Agent 4 (testing & priority)

---

## Table of Contents

1. [Spanish (es) — Complete messages.json](#1-spanish-es--complete-messagesjson)
2. [German (de) — Complete messages.json](#2-german-de--complete-messagesjson)
3. [Japanese (ja) — Complete messages.json](#3-japanese-ja--complete-messagesjson)
4. [French (fr) — Complete messages.json](#4-french-fr--complete-messagesjson)
5. [Portuguese-BR (pt_BR) — Complete messages.json](#5-portuguese-br-pt_br--complete-messagesjson)
6. [Integration Architecture](#6-integration-architecture)
7. [Migration Guide](#7-migration-guide)

---

## Translation Conventions

### Brand Terms (NEVER Translate)
- **Focus Mode** — product name, always in English
- **Focus Score** — gamification metric, always in English
- **Nuclear Mode** — power feature, always in English
- **Zovo** — company name, always in English
- **Pro** — tier name, always in English

### Placeholder Conventions
- `$1`, `$2`, etc. — positional substitution tokens used by `chrome.i18n.getMessage()`
- `$COUNT$`, `$URL$`, etc. — named placeholders (defined in `placeholders` object)
- Translators must preserve all placeholders exactly as-is

### Quality Standards
- Each locale targets native-speaker quality, not machine translation
- Formal but approachable tone (usted-level in Spanish, Sie-level in German, desu/masu in Japanese, vous-level in French, voce-level in Portuguese)
- UI strings kept concise to fit Chrome extension constraints
- Motivational quotes sourced from culturally relevant figures where possible

---

## 1. Spanish (es) — Complete messages.json

**Locale:** `_locales/es/messages.json`
**Target markets:** Spain, Mexico, Colombia, Argentina, Chile, Peru
**Register:** Formal-friendly (usted implied, but natural UI tone)

```json
{
  "_locale_metadata": {
    "message": "es",
    "description": "Spanish locale metadata"
  },

  "extension_name": {
    "message": "Focus Mode - Blocker",
    "description": "Extension name — brand term, do not translate"
  },
  "extension_description": {
    "message": "Bloquea sitios web que distraen, temporizador Pomodoro, Focus Score y Nuclear Mode. Mantente concentrado y productivo.",
    "description": "Chrome Web Store extension description"
  },
  "extension_short_description": {
    "message": "Bloquea distracciones. Mantente enfocado.",
    "description": "Short tagline for the extension"
  },

  "popup_title": {
    "message": "Focus Mode",
    "description": "Popup header title — brand term"
  },
  "popup_state_idle": {
    "message": "Listo para enfocarse",
    "description": "Popup state when no session is active"
  },
  "popup_state_focus": {
    "message": "Sesion de enfoque activa",
    "description": "Popup state during focus session"
  },
  "popup_state_break": {
    "message": "Tiempo de descanso",
    "description": "Popup state during break"
  },
  "popup_state_long_break": {
    "message": "Descanso largo",
    "description": "Popup state during long break"
  },
  "popup_state_nuclear": {
    "message": "Nuclear Mode activo",
    "description": "Popup state when Nuclear Mode is engaged"
  },
  "popup_state_paused": {
    "message": "Sesion en pausa",
    "description": "Popup state when session is paused"
  },

  "popup_btn_start_focus": {
    "message": "Iniciar enfoque",
    "description": "Button to start a focus session"
  },
  "popup_btn_stop": {
    "message": "Detener",
    "description": "Button to stop current session"
  },
  "popup_btn_pause": {
    "message": "Pausar",
    "description": "Button to pause current session"
  },
  "popup_btn_resume": {
    "message": "Reanudar",
    "description": "Button to resume paused session"
  },
  "popup_btn_skip_break": {
    "message": "Saltar descanso",
    "description": "Button to skip break and start next focus"
  },
  "popup_btn_start_break": {
    "message": "Iniciar descanso",
    "description": "Button to start a break"
  },
  "popup_btn_nuclear": {
    "message": "Activar Nuclear Mode",
    "description": "Button to activate Nuclear Mode"
  },
  "popup_btn_settings": {
    "message": "Configuracion",
    "description": "Button to open settings/options page"
  },
  "popup_btn_upgrade": {
    "message": "Mejorar a Pro",
    "description": "Button to upgrade to Pro"
  },

  "popup_timer_minutes": {
    "message": "$MINS$ min",
    "description": "Timer display in minutes",
    "placeholders": {
      "mins": { "content": "$1", "example": "25" }
    }
  },
  "popup_timer_seconds": {
    "message": "$MINS$:$SECS$",
    "description": "Timer display mm:ss",
    "placeholders": {
      "mins": { "content": "$1", "example": "24" },
      "secs": { "content": "$2", "example": "59" }
    }
  },
  "popup_sessions_today": {
    "message": "$COUNT$ sesiones hoy",
    "description": "Number of focus sessions completed today",
    "placeholders": {
      "count": { "content": "$1", "example": "4" }
    }
  },
  "popup_focus_score_label": {
    "message": "Focus Score",
    "description": "Label for Focus Score display — brand term"
  },
  "popup_focus_score_value": {
    "message": "$SCORE$/100",
    "description": "Focus Score numeric display",
    "placeholders": {
      "score": { "content": "$1", "example": "85" }
    }
  },
  "popup_streak_label": {
    "message": "Racha",
    "description": "Label for streak counter"
  },
  "popup_streak_days": {
    "message": "$COUNT$ dias",
    "description": "Streak day count",
    "placeholders": {
      "count": { "content": "$1", "example": "7" }
    }
  },
  "popup_quick_block": {
    "message": "Bloqueo rapido",
    "description": "Quick block site button"
  },
  "popup_blocked_count": {
    "message": "$COUNT$ sitios bloqueados",
    "description": "Number of blocked sites",
    "placeholders": {
      "count": { "content": "$1", "example": "12" }
    }
  },
  "popup_focus_time_today": {
    "message": "$TIME$ de enfoque hoy",
    "description": "Total focus time today",
    "placeholders": {
      "time": { "content": "$1", "example": "2h 15m" }
    }
  },

  "options_title": {
    "message": "Configuracion de Focus Mode",
    "description": "Options page title"
  },
  "options_nav_general": {
    "message": "General",
    "description": "Options navigation — general section"
  },
  "options_nav_timer": {
    "message": "Temporizador",
    "description": "Options navigation — timer section"
  },
  "options_nav_blocklist": {
    "message": "Lista de bloqueo",
    "description": "Options navigation — blocklist section"
  },
  "options_nav_nuclear": {
    "message": "Nuclear Mode",
    "description": "Options navigation — Nuclear Mode section"
  },
  "options_nav_sounds": {
    "message": "Sonidos",
    "description": "Options navigation — sounds section"
  },
  "options_nav_stats": {
    "message": "Estadisticas",
    "description": "Options navigation — statistics section"
  },
  "options_nav_account": {
    "message": "Cuenta",
    "description": "Options navigation — account section"
  },
  "options_nav_about": {
    "message": "Acerca de",
    "description": "Options navigation — about section"
  },

  "options_general_language": {
    "message": "Idioma",
    "description": "Language selector label"
  },
  "options_general_language_auto": {
    "message": "Automatico (idioma del navegador)",
    "description": "Auto-detect language option"
  },
  "options_general_theme": {
    "message": "Tema",
    "description": "Theme selector label"
  },
  "options_general_theme_light": {
    "message": "Claro",
    "description": "Light theme option"
  },
  "options_general_theme_dark": {
    "message": "Oscuro",
    "description": "Dark theme option"
  },
  "options_general_theme_system": {
    "message": "Sistema",
    "description": "System theme option"
  },
  "options_general_notifications": {
    "message": "Notificaciones",
    "description": "Notifications toggle label"
  },
  "options_general_notifications_desc": {
    "message": "Mostrar notificaciones al iniciar y terminar sesiones",
    "description": "Notifications toggle description"
  },
  "options_general_badge": {
    "message": "Icono de insignia",
    "description": "Badge icon toggle label"
  },
  "options_general_badge_desc": {
    "message": "Mostrar tiempo restante en el icono de la extension",
    "description": "Badge icon description"
  },
  "options_general_startup": {
    "message": "Iniciar al abrir el navegador",
    "description": "Auto-start on browser open"
  },
  "options_general_startup_desc": {
    "message": "Iniciar automaticamente una sesion de enfoque al abrir Chrome",
    "description": "Auto-start description"
  },

  "options_timer_focus_duration": {
    "message": "Duracion del enfoque",
    "description": "Focus duration setting label"
  },
  "options_timer_focus_duration_desc": {
    "message": "Duracion de cada sesion de enfoque en minutos",
    "description": "Focus duration description"
  },
  "options_timer_break_duration": {
    "message": "Duracion del descanso",
    "description": "Break duration setting label"
  },
  "options_timer_break_duration_desc": {
    "message": "Duracion de cada descanso corto en minutos",
    "description": "Break duration description"
  },
  "options_timer_long_break": {
    "message": "Descanso largo",
    "description": "Long break duration label"
  },
  "options_timer_long_break_desc": {
    "message": "Duracion del descanso largo en minutos",
    "description": "Long break duration description"
  },
  "options_timer_sessions_before_long": {
    "message": "Sesiones antes del descanso largo",
    "description": "Sessions before long break"
  },
  "options_timer_auto_start_break": {
    "message": "Iniciar descanso automaticamente",
    "description": "Auto-start break toggle"
  },
  "options_timer_auto_start_focus": {
    "message": "Iniciar enfoque automaticamente",
    "description": "Auto-start next focus toggle"
  },
  "options_timer_minutes_label": {
    "message": "minutos",
    "description": "Minutes unit label"
  },

  "options_blocklist_title": {
    "message": "Sitios bloqueados",
    "description": "Blocklist section title"
  },
  "options_blocklist_add": {
    "message": "Agregar sitio",
    "description": "Add site button"
  },
  "options_blocklist_add_placeholder": {
    "message": "Ingrese un dominio (ej. facebook.com)",
    "description": "Add site input placeholder"
  },
  "options_blocklist_remove": {
    "message": "Eliminar",
    "description": "Remove site button"
  },
  "options_blocklist_empty": {
    "message": "No hay sitios bloqueados. Agregue sitios para bloquear durante las sesiones de enfoque.",
    "description": "Empty blocklist message"
  },
  "options_blocklist_import": {
    "message": "Importar lista",
    "description": "Import blocklist button"
  },
  "options_blocklist_export": {
    "message": "Exportar lista",
    "description": "Export blocklist button"
  },
  "options_blocklist_preset": {
    "message": "Listas predefinidas",
    "description": "Preset blocklist button"
  },
  "options_blocklist_preset_social": {
    "message": "Redes sociales",
    "description": "Social media preset"
  },
  "options_blocklist_preset_news": {
    "message": "Noticias",
    "description": "News sites preset"
  },
  "options_blocklist_preset_entertainment": {
    "message": "Entretenimiento",
    "description": "Entertainment preset"
  },
  "options_blocklist_preset_shopping": {
    "message": "Compras",
    "description": "Shopping sites preset"
  },
  "options_blocklist_always_block": {
    "message": "Bloquear siempre",
    "description": "Always block toggle (not just during focus)"
  },
  "options_blocklist_schedule": {
    "message": "Programar bloqueo",
    "description": "Schedule-based blocking"
  },

  "options_nuclear_title": {
    "message": "Configuracion de Nuclear Mode",
    "description": "Nuclear Mode settings title"
  },
  "options_nuclear_desc": {
    "message": "Nuclear Mode bloquea todos los sitios de la lista sin posibilidad de desactivarlo hasta que termine el tiempo.",
    "description": "Nuclear Mode description"
  },
  "options_nuclear_duration": {
    "message": "Duracion de Nuclear Mode",
    "description": "Nuclear Mode duration label"
  },
  "options_nuclear_block_all": {
    "message": "Bloquear todos los sitios (no solo la lista)",
    "description": "Block all sites option in Nuclear Mode"
  },
  "options_nuclear_allowlist": {
    "message": "Sitios permitidos en Nuclear Mode",
    "description": "Nuclear Mode allowlist"
  },
  "options_nuclear_allowlist_add": {
    "message": "Agregar sitio permitido",
    "description": "Add to Nuclear Mode allowlist"
  },
  "options_nuclear_warning": {
    "message": "Nuclear Mode no se puede desactivar una vez iniciado. Use con precaucion.",
    "description": "Nuclear Mode warning text"
  },
  "options_nuclear_confirm": {
    "message": "Confirmar activacion",
    "description": "Confirm Nuclear Mode activation"
  },

  "options_sounds_title": {
    "message": "Sonidos ambientales",
    "description": "Ambient sounds section title"
  },
  "options_sounds_enable": {
    "message": "Activar sonidos durante el enfoque",
    "description": "Enable sounds toggle"
  },
  "options_sounds_volume": {
    "message": "Volumen",
    "description": "Volume slider label"
  },
  "options_sounds_rain": {
    "message": "Lluvia",
    "description": "Rain ambient sound"
  },
  "options_sounds_forest": {
    "message": "Bosque",
    "description": "Forest ambient sound"
  },
  "options_sounds_cafe": {
    "message": "Cafeteria",
    "description": "Cafe ambient sound"
  },
  "options_sounds_ocean": {
    "message": "Oceano",
    "description": "Ocean ambient sound"
  },
  "options_sounds_white_noise": {
    "message": "Ruido blanco",
    "description": "White noise ambient sound"
  },
  "options_sounds_fireplace": {
    "message": "Chimenea",
    "description": "Fireplace ambient sound"
  },
  "options_sounds_notification": {
    "message": "Sonido de notificacion",
    "description": "Notification sound selector"
  },
  "options_sounds_notification_chime": {
    "message": "Campana",
    "description": "Chime notification sound"
  },
  "options_sounds_notification_bell": {
    "message": "Timbre",
    "description": "Bell notification sound"
  },
  "options_sounds_notification_none": {
    "message": "Sin sonido",
    "description": "No notification sound"
  },

  "options_stats_title": {
    "message": "Estadisticas",
    "description": "Statistics section title"
  },
  "options_stats_today": {
    "message": "Hoy",
    "description": "Today tab"
  },
  "options_stats_week": {
    "message": "Esta semana",
    "description": "This week tab"
  },
  "options_stats_month": {
    "message": "Este mes",
    "description": "This month tab"
  },
  "options_stats_all_time": {
    "message": "Todo el tiempo",
    "description": "All time tab"
  },
  "options_stats_focus_time": {
    "message": "Tiempo de enfoque",
    "description": "Focus time stat label"
  },
  "options_stats_sessions": {
    "message": "Sesiones completadas",
    "description": "Completed sessions stat"
  },
  "options_stats_blocked": {
    "message": "Sitios bloqueados",
    "description": "Sites blocked stat"
  },
  "options_stats_streak": {
    "message": "Mejor racha",
    "description": "Best streak stat"
  },
  "options_stats_avg_score": {
    "message": "Focus Score promedio",
    "description": "Average Focus Score"
  },
  "options_stats_export": {
    "message": "Exportar datos",
    "description": "Export statistics data"
  },
  "options_stats_reset": {
    "message": "Restablecer estadisticas",
    "description": "Reset statistics button"
  },
  "options_stats_reset_confirm": {
    "message": "Esta accion eliminara todas las estadisticas permanentemente. No se puede deshacer.",
    "description": "Reset confirmation message"
  },

  "options_account_title": {
    "message": "Cuenta",
    "description": "Account section title"
  },
  "options_account_plan_free": {
    "message": "Plan gratuito",
    "description": "Free plan label"
  },
  "options_account_plan_pro": {
    "message": "Focus Mode Pro",
    "description": "Pro plan label"
  },
  "options_account_upgrade": {
    "message": "Mejorar a Pro",
    "description": "Upgrade button"
  },
  "options_account_manage": {
    "message": "Administrar suscripcion",
    "description": "Manage subscription link"
  },
  "options_account_restore": {
    "message": "Restaurar compra",
    "description": "Restore purchase button"
  },
  "options_account_data_sync": {
    "message": "Sincronizacion de datos",
    "description": "Data sync toggle"
  },
  "options_account_data_sync_desc": {
    "message": "Sincronizar configuracion entre dispositivos (requiere Pro)",
    "description": "Data sync description"
  },

  "options_about_title": {
    "message": "Acerca de Focus Mode",
    "description": "About section title"
  },
  "options_about_version": {
    "message": "Version $VERSION$",
    "description": "Version display",
    "placeholders": {
      "version": { "content": "$1", "example": "1.0.0" }
    }
  },
  "options_about_developer": {
    "message": "Desarrollado por Zovo",
    "description": "Developer credit"
  },
  "options_about_rate": {
    "message": "Calificar en Chrome Web Store",
    "description": "Rate extension link"
  },
  "options_about_feedback": {
    "message": "Enviar comentarios",
    "description": "Feedback link"
  },
  "options_about_privacy": {
    "message": "Politica de privacidad",
    "description": "Privacy policy link"
  },
  "options_about_terms": {
    "message": "Terminos de servicio",
    "description": "Terms of service link"
  },
  "options_about_changelog": {
    "message": "Registro de cambios",
    "description": "Changelog link"
  },
  "options_about_support": {
    "message": "Centro de ayuda",
    "description": "Support/help center link"
  },

  "block_page_title": {
    "message": "Sitio bloqueado",
    "description": "Block page title"
  },
  "block_page_heading": {
    "message": "Este sitio esta bloqueado",
    "description": "Block page main heading"
  },
  "block_page_description": {
    "message": "$SITE$ esta bloqueado durante tu sesion de enfoque. Mantente concentrado en lo que importa.",
    "description": "Block page description",
    "placeholders": {
      "site": { "content": "$1", "example": "facebook.com" }
    }
  },
  "block_page_time_remaining": {
    "message": "Tiempo restante: $TIME$",
    "description": "Time remaining on block page",
    "placeholders": {
      "time": { "content": "$1", "example": "18:32" }
    }
  },
  "block_page_nuclear_active": {
    "message": "Nuclear Mode esta activo. Este sitio no se puede desbloquear.",
    "description": "Nuclear Mode active message on block page"
  },
  "block_page_btn_go_back": {
    "message": "Volver atras",
    "description": "Go back button on block page"
  },
  "block_page_btn_dashboard": {
    "message": "Ir al panel",
    "description": "Go to dashboard button"
  },
  "block_page_focus_score": {
    "message": "Tu Focus Score: $SCORE$",
    "description": "Focus Score display on block page",
    "placeholders": {
      "score": { "content": "$1", "example": "85" }
    }
  },
  "block_page_sessions_today": {
    "message": "Sesiones hoy: $COUNT$",
    "description": "Sessions today on block page",
    "placeholders": {
      "count": { "content": "$1", "example": "3" }
    }
  },
  "block_page_streak": {
    "message": "Racha actual: $DAYS$ dias",
    "description": "Current streak on block page",
    "placeholders": {
      "days": { "content": "$1", "example": "7" }
    }
  },

  "block_page_quote_1": {
    "message": "La disciplina es el puente entre las metas y los logros.",
    "description": "Motivational quote 1 — Jim Rohn"
  },
  "block_page_quote_2": {
    "message": "El exito es la suma de pequenos esfuerzos repetidos dia tras dia.",
    "description": "Motivational quote 2 — Robert Collier"
  },
  "block_page_quote_3": {
    "message": "Concentrate en ser productivo, no en estar ocupado.",
    "description": "Motivational quote 3 — Tim Ferriss"
  },
  "block_page_quote_4": {
    "message": "La concentracion es la raiz de todas las capacidades del ser humano.",
    "description": "Motivational quote 4 — Bruce Lee"
  },
  "block_page_quote_5": {
    "message": "No es que tengamos poco tiempo, sino que perdemos mucho.",
    "description": "Motivational quote 5 — Seneca"
  },
  "block_page_quote_6": {
    "message": "El futuro depende de lo que hagas hoy.",
    "description": "Motivational quote 6 — Mahatma Gandhi"
  },
  "block_page_quote_7": {
    "message": "Donde hay enfoque, hay poder.",
    "description": "Motivational quote 7 — Tony Robbins"
  },
  "block_page_quote_8": {
    "message": "La mejor forma de predecir el futuro es crearlo.",
    "description": "Motivational quote 8 — Peter Drucker"
  },
  "block_page_quote_9": {
    "message": "Cada momento es una nueva oportunidad para cambiar tu vida.",
    "description": "Motivational quote 9"
  },
  "block_page_quote_10": {
    "message": "Haz hoy lo que otros no quieren, para tener manana lo que otros no tendran.",
    "description": "Motivational quote 10"
  },

  "onboarding_welcome_title": {
    "message": "Bienvenido a Focus Mode",
    "description": "Onboarding slide 1 title"
  },
  "onboarding_welcome_desc": {
    "message": "Bloquea distracciones, aumenta tu productividad y alcanza tus metas con sesiones de enfoque estructuradas.",
    "description": "Onboarding slide 1 description"
  },
  "onboarding_blocklist_title": {
    "message": "Configura tu lista de bloqueo",
    "description": "Onboarding slide 2 title"
  },
  "onboarding_blocklist_desc": {
    "message": "Agrega los sitios web que te distraen. Los bloquearemos durante tus sesiones de enfoque para que puedas concentrarte.",
    "description": "Onboarding slide 2 description"
  },
  "onboarding_timer_title": {
    "message": "Personaliza tu temporizador",
    "description": "Onboarding slide 3 title"
  },
  "onboarding_timer_desc": {
    "message": "Configura la duracion de tus sesiones de enfoque y descansos. Usa la tecnica Pomodoro o crea tu propio ritmo.",
    "description": "Onboarding slide 3 description"
  },
  "onboarding_score_title": {
    "message": "Conoce tu Focus Score",
    "description": "Onboarding slide 4 title"
  },
  "onboarding_score_desc": {
    "message": "Tu Focus Score (0-100) mide tu nivel de concentracion. Completa sesiones, evita distracciones y construye rachas para mejorar tu puntuacion.",
    "description": "Onboarding slide 4 description"
  },
  "onboarding_ready_title": {
    "message": "Listo para enfocarse",
    "description": "Onboarding slide 5 title"
  },
  "onboarding_ready_desc": {
    "message": "Todo esta configurado. Inicia tu primera sesion de enfoque y comienza a ser mas productivo ahora mismo.",
    "description": "Onboarding slide 5 description"
  },
  "onboarding_btn_next": {
    "message": "Siguiente",
    "description": "Next button in onboarding"
  },
  "onboarding_btn_skip": {
    "message": "Saltar",
    "description": "Skip button in onboarding"
  },
  "onboarding_btn_back": {
    "message": "Atras",
    "description": "Back button in onboarding"
  },
  "onboarding_btn_get_started": {
    "message": "Comenzar",
    "description": "Get started button (final slide)"
  },
  "onboarding_btn_add_sites": {
    "message": "Agregar sitios",
    "description": "Add sites button in onboarding"
  },
  "onboarding_progress": {
    "message": "$CURRENT$ de $TOTAL$",
    "description": "Onboarding progress indicator",
    "placeholders": {
      "current": { "content": "$1", "example": "2" },
      "total": { "content": "$2", "example": "5" }
    }
  },

  "notification_focus_started": {
    "message": "Sesion de enfoque iniciada. $MINS$ minutos de concentracion.",
    "description": "Notification when focus session starts",
    "placeholders": {
      "mins": { "content": "$1", "example": "25" }
    }
  },
  "notification_focus_complete": {
    "message": "Sesion de enfoque completada. Excelente trabajo.",
    "description": "Notification when focus session completes"
  },
  "notification_break_started": {
    "message": "Hora del descanso. Relajate por $MINS$ minutos.",
    "description": "Notification when break starts",
    "placeholders": {
      "mins": { "content": "$1", "example": "5" }
    }
  },
  "notification_break_over": {
    "message": "Descanso terminado. Listo para la siguiente sesion.",
    "description": "Notification when break is over"
  },
  "notification_nuclear_started": {
    "message": "Nuclear Mode activado por $MINS$ minutos. Todos los sitios estan bloqueados.",
    "description": "Notification when Nuclear Mode starts",
    "placeholders": {
      "mins": { "content": "$1", "example": "60" }
    }
  },
  "notification_nuclear_ended": {
    "message": "Nuclear Mode ha terminado. Los sitios se han desbloqueado.",
    "description": "Notification when Nuclear Mode ends"
  },
  "notification_streak_milestone": {
    "message": "Racha de $DAYS$ dias. Sigue asi.",
    "description": "Streak milestone notification",
    "placeholders": {
      "days": { "content": "$1", "example": "7" }
    }
  },
  "notification_score_improved": {
    "message": "Tu Focus Score ha subido a $SCORE$.",
    "description": "Focus Score improvement notification",
    "placeholders": {
      "score": { "content": "$1", "example": "90" }
    }
  },
  "notification_daily_goal": {
    "message": "Meta diaria completada. Has completado $COUNT$ sesiones hoy.",
    "description": "Daily goal completed notification",
    "placeholders": {
      "count": { "content": "$1", "example": "4" }
    }
  },

  "error_invalid_url": {
    "message": "URL no valida. Ingrese un dominio correcto.",
    "description": "Invalid URL error"
  },
  "error_duplicate_site": {
    "message": "Este sitio ya esta en la lista de bloqueo.",
    "description": "Duplicate site error"
  },
  "error_storage_full": {
    "message": "Almacenamiento lleno. Elimine algunos datos para continuar.",
    "description": "Storage full error"
  },
  "error_network": {
    "message": "Error de conexion. Verifique su conexion a internet.",
    "description": "Network error"
  },
  "error_generic": {
    "message": "Algo salio mal. Intente de nuevo.",
    "description": "Generic error message"
  },
  "error_permission_denied": {
    "message": "Permiso denegado. Verifique los permisos de la extension.",
    "description": "Permission denied error"
  },
  "error_session_conflict": {
    "message": "Ya hay una sesion activa.",
    "description": "Session conflict error"
  },
  "error_nuclear_active": {
    "message": "No se puede modificar la configuracion mientras Nuclear Mode esta activo.",
    "description": "Cannot modify during Nuclear Mode"
  },
  "error_import_invalid": {
    "message": "Archivo de importacion no valido.",
    "description": "Invalid import file error"
  },
  "error_export_failed": {
    "message": "Error al exportar datos.",
    "description": "Export failed error"
  },

  "paywall_title": {
    "message": "Desbloquea Focus Mode Pro",
    "description": "Paywall title (T1)"
  },
  "paywall_subtitle": {
    "message": "Lleva tu productividad al siguiente nivel",
    "description": "Paywall subtitle (T2)"
  },
  "paywall_feature_1": {
    "message": "Sitios bloqueados ilimitados",
    "description": "Pro feature 1 (T3)"
  },
  "paywall_feature_2": {
    "message": "Estadisticas detalladas y graficos",
    "description": "Pro feature 2 (T4)"
  },
  "paywall_feature_3": {
    "message": "Nuclear Mode avanzado",
    "description": "Pro feature 3 (T5)"
  },
  "paywall_feature_4": {
    "message": "Sonidos ambientales premium",
    "description": "Pro feature 4 (T6)"
  },
  "paywall_feature_5": {
    "message": "Sincronizacion entre dispositivos",
    "description": "Pro feature 5 (T7)"
  },
  "paywall_feature_6": {
    "message": "Programacion de bloqueo personalizada",
    "description": "Pro feature 6 (T8)"
  },
  "paywall_price_monthly": {
    "message": "$PRICE$/mes",
    "description": "Monthly price display (T9)",
    "placeholders": {
      "price": { "content": "$1", "example": "$4.99" }
    }
  },
  "paywall_price_lifetime": {
    "message": "$PRICE$ pago unico",
    "description": "Lifetime price display (T10)",
    "placeholders": {
      "price": { "content": "$1", "example": "$49.99" }
    }
  },
  "paywall_btn_subscribe": {
    "message": "Suscribirse a Pro",
    "description": "Subscribe button"
  },
  "paywall_btn_lifetime": {
    "message": "Comprar de por vida",
    "description": "Lifetime purchase button"
  },
  "paywall_btn_restore": {
    "message": "Restaurar compra",
    "description": "Restore purchase button"
  },
  "paywall_guarantee": {
    "message": "Garantia de devolucion de 30 dias",
    "description": "Money-back guarantee text"
  },
  "paywall_trial": {
    "message": "Prueba gratuita de 7 dias",
    "description": "Free trial text"
  },
  "paywall_cancel_anytime": {
    "message": "Cancela cuando quieras",
    "description": "Cancel anytime text"
  },

  "achievement_first_session": {
    "message": "Primera sesion completada",
    "description": "First session achievement"
  },
  "achievement_ten_sessions": {
    "message": "10 sesiones completadas",
    "description": "10 sessions achievement"
  },
  "achievement_hundred_sessions": {
    "message": "100 sesiones completadas",
    "description": "100 sessions achievement"
  },
  "achievement_first_streak": {
    "message": "Primera racha de 3 dias",
    "description": "First 3-day streak"
  },
  "achievement_week_streak": {
    "message": "Racha de 7 dias",
    "description": "7-day streak achievement"
  },
  "achievement_month_streak": {
    "message": "Racha de 30 dias",
    "description": "30-day streak achievement"
  },
  "achievement_focus_master": {
    "message": "Focus Score de 90+",
    "description": "Focus Score 90+ achievement"
  },
  "achievement_nuclear_survivor": {
    "message": "Sobreviviste a Nuclear Mode",
    "description": "Completed a Nuclear Mode session"
  },
  "achievement_early_bird": {
    "message": "Madrugador — sesion antes de las 7am",
    "description": "Early bird achievement"
  },
  "achievement_night_owl": {
    "message": "Noctambulo — sesion despues de las 11pm",
    "description": "Night owl achievement"
  },
  "achievement_unlocked": {
    "message": "Logro desbloqueado: $NAME$",
    "description": "Achievement unlocked notification",
    "placeholders": {
      "name": { "content": "$1", "example": "Primera sesion" }
    }
  },

  "streak_lost": {
    "message": "Racha perdida. Comienza una nueva hoy.",
    "description": "Streak lost message"
  },
  "streak_at_risk": {
    "message": "Tu racha de $DAYS$ dias esta en riesgo. Completa una sesion hoy.",
    "description": "Streak at risk warning",
    "placeholders": {
      "days": { "content": "$1", "example": "5" }
    }
  },
  "streak_protected": {
    "message": "Racha protegida (Pro)",
    "description": "Streak protection Pro feature"
  },
  "streak_frozen": {
    "message": "Racha congelada por hoy",
    "description": "Streak freeze active"
  },
  "streak_new_record": {
    "message": "Nuevo record de racha: $DAYS$ dias",
    "description": "New streak record",
    "placeholders": {
      "days": { "content": "$1", "example": "14" }
    }
  },

  "common_save": {
    "message": "Guardar",
    "description": "Save button"
  },
  "common_cancel": {
    "message": "Cancelar",
    "description": "Cancel button"
  },
  "common_confirm": {
    "message": "Confirmar",
    "description": "Confirm button"
  },
  "common_delete": {
    "message": "Eliminar",
    "description": "Delete button"
  },
  "common_edit": {
    "message": "Editar",
    "description": "Edit button"
  },
  "common_close": {
    "message": "Cerrar",
    "description": "Close button"
  },
  "common_done": {
    "message": "Listo",
    "description": "Done button"
  },
  "common_loading": {
    "message": "Cargando...",
    "description": "Loading state"
  },
  "common_enabled": {
    "message": "Activado",
    "description": "Enabled state"
  },
  "common_disabled": {
    "message": "Desactivado",
    "description": "Disabled state"
  },
  "common_on": {
    "message": "Encendido",
    "description": "On toggle state"
  },
  "common_off": {
    "message": "Apagado",
    "description": "Off toggle state"
  },
  "common_yes": {
    "message": "Si",
    "description": "Yes"
  },
  "common_no": {
    "message": "No",
    "description": "No"
  },
  "common_ok": {
    "message": "Aceptar",
    "description": "OK button"
  },
  "common_reset": {
    "message": "Restablecer",
    "description": "Reset button"
  },
  "common_retry": {
    "message": "Reintentar",
    "description": "Retry button"
  },
  "common_learn_more": {
    "message": "Mas informacion",
    "description": "Learn more link"
  },
  "common_pro_badge": {
    "message": "Pro",
    "description": "Pro badge label — brand term"
  },
  "common_free_badge": {
    "message": "Gratis",
    "description": "Free badge label"
  },
  "common_new_badge": {
    "message": "Nuevo",
    "description": "New badge label"
  },
  "common_hours": {
    "message": "$COUNT$h",
    "description": "Hours abbreviation",
    "placeholders": {
      "count": { "content": "$1", "example": "2" }
    }
  },
  "common_minutes": {
    "message": "$COUNT$m",
    "description": "Minutes abbreviation",
    "placeholders": {
      "count": { "content": "$1", "example": "30" }
    }
  },
  "common_seconds": {
    "message": "$COUNT$s",
    "description": "Seconds abbreviation",
    "placeholders": {
      "count": { "content": "$1", "example": "45" }
    }
  },
  "common_days": {
    "message": "$COUNT$ dias",
    "description": "Days with count",
    "placeholders": {
      "count": { "content": "$1", "example": "7" }
    }
  },
  "common_today": {
    "message": "Hoy",
    "description": "Today"
  },
  "common_yesterday": {
    "message": "Ayer",
    "description": "Yesterday"
  },
  "common_this_week": {
    "message": "Esta semana",
    "description": "This week"
  },
  "common_all_time": {
    "message": "Todo el tiempo",
    "description": "All time"
  }
}
```

**Spanish translation notes:**
- Total entries: 210+
- Brand terms kept in English: Focus Mode, Focus Score, Nuclear Mode, Zovo, Pro
- Register: formal but natural (avoids stiff "usted" constructions in favor of impersonal/infinitive forms common in software UI)
- Regional neutrality: uses vocabulary common to all major Spanish-speaking markets (avoids region-specific slang)
- Motivational quotes: sourced from universally known figures plus Spanish-appropriate adaptations

---

## 2. German (de) — Complete messages.json

**Locale:** `_locales/de/messages.json`
**Target markets:** Germany, Austria, Switzerland
**Register:** Formal-polite (Sie-form where applicable, but modern software UI tone)
**Note:** German text averages 20-30% longer than English; strings have been kept concise for UI constraints.

```json
{
  "_locale_metadata": {
    "message": "de",
    "description": "German locale metadata"
  },

  "extension_name": {
    "message": "Focus Mode - Blocker",
    "description": "Extension name — brand term, do not translate"
  },
  "extension_description": {
    "message": "Blockiert ablenkende Websites, Pomodoro-Timer, Focus Score und Nuclear Mode. Bleiben Sie konzentriert und produktiv.",
    "description": "Chrome Web Store extension description"
  },
  "extension_short_description": {
    "message": "Ablenkungen blockieren. Konzentriert bleiben.",
    "description": "Short tagline for the extension"
  },

  "popup_title": {
    "message": "Focus Mode",
    "description": "Popup header title — brand term"
  },
  "popup_state_idle": {
    "message": "Bereit zum Fokussieren",
    "description": "Popup state when no session is active"
  },
  "popup_state_focus": {
    "message": "Fokus-Sitzung aktiv",
    "description": "Popup state during focus session"
  },
  "popup_state_break": {
    "message": "Pausenzeit",
    "description": "Popup state during break"
  },
  "popup_state_long_break": {
    "message": "Lange Pause",
    "description": "Popup state during long break"
  },
  "popup_state_nuclear": {
    "message": "Nuclear Mode aktiv",
    "description": "Popup state when Nuclear Mode is engaged"
  },
  "popup_state_paused": {
    "message": "Sitzung pausiert",
    "description": "Popup state when session is paused"
  },

  "popup_btn_start_focus": {
    "message": "Fokus starten",
    "description": "Button to start a focus session"
  },
  "popup_btn_stop": {
    "message": "Stoppen",
    "description": "Button to stop current session"
  },
  "popup_btn_pause": {
    "message": "Pausieren",
    "description": "Button to pause current session"
  },
  "popup_btn_resume": {
    "message": "Fortsetzen",
    "description": "Button to resume paused session"
  },
  "popup_btn_skip_break": {
    "message": "Pause uberspringen",
    "description": "Button to skip break and start next focus"
  },
  "popup_btn_start_break": {
    "message": "Pause starten",
    "description": "Button to start a break"
  },
  "popup_btn_nuclear": {
    "message": "Nuclear Mode aktivieren",
    "description": "Button to activate Nuclear Mode"
  },
  "popup_btn_settings": {
    "message": "Einstellungen",
    "description": "Button to open settings/options page"
  },
  "popup_btn_upgrade": {
    "message": "Auf Pro upgraden",
    "description": "Button to upgrade to Pro"
  },

  "popup_timer_minutes": {
    "message": "$MINS$ Min.",
    "description": "Timer display in minutes",
    "placeholders": {
      "mins": { "content": "$1", "example": "25" }
    }
  },
  "popup_timer_seconds": {
    "message": "$MINS$:$SECS$",
    "description": "Timer display mm:ss",
    "placeholders": {
      "mins": { "content": "$1", "example": "24" },
      "secs": { "content": "$2", "example": "59" }
    }
  },
  "popup_sessions_today": {
    "message": "$COUNT$ Sitzungen heute",
    "description": "Number of focus sessions completed today",
    "placeholders": {
      "count": { "content": "$1", "example": "4" }
    }
  },
  "popup_focus_score_label": {
    "message": "Focus Score",
    "description": "Label for Focus Score display — brand term"
  },
  "popup_focus_score_value": {
    "message": "$SCORE$/100",
    "description": "Focus Score numeric display",
    "placeholders": {
      "score": { "content": "$1", "example": "85" }
    }
  },
  "popup_streak_label": {
    "message": "Serie",
    "description": "Label for streak counter"
  },
  "popup_streak_days": {
    "message": "$COUNT$ Tage",
    "description": "Streak day count",
    "placeholders": {
      "count": { "content": "$1", "example": "7" }
    }
  },
  "popup_quick_block": {
    "message": "Schnell blockieren",
    "description": "Quick block site button"
  },
  "popup_blocked_count": {
    "message": "$COUNT$ blockierte Seiten",
    "description": "Number of blocked sites",
    "placeholders": {
      "count": { "content": "$1", "example": "12" }
    }
  },
  "popup_focus_time_today": {
    "message": "$TIME$ Fokuszeit heute",
    "description": "Total focus time today",
    "placeholders": {
      "time": { "content": "$1", "example": "2h 15m" }
    }
  },

  "options_title": {
    "message": "Focus Mode Einstellungen",
    "description": "Options page title"
  },
  "options_nav_general": {
    "message": "Allgemein",
    "description": "Options navigation — general section"
  },
  "options_nav_timer": {
    "message": "Timer",
    "description": "Options navigation — timer section"
  },
  "options_nav_blocklist": {
    "message": "Sperrliste",
    "description": "Options navigation — blocklist section"
  },
  "options_nav_nuclear": {
    "message": "Nuclear Mode",
    "description": "Options navigation — Nuclear Mode section"
  },
  "options_nav_sounds": {
    "message": "Klange",
    "description": "Options navigation — sounds section"
  },
  "options_nav_stats": {
    "message": "Statistiken",
    "description": "Options navigation — statistics section"
  },
  "options_nav_account": {
    "message": "Konto",
    "description": "Options navigation — account section"
  },
  "options_nav_about": {
    "message": "Info",
    "description": "Options navigation — about section"
  },

  "options_general_language": {
    "message": "Sprache",
    "description": "Language selector label"
  },
  "options_general_language_auto": {
    "message": "Automatisch (Browsersprache)",
    "description": "Auto-detect language option"
  },
  "options_general_theme": {
    "message": "Design",
    "description": "Theme selector label"
  },
  "options_general_theme_light": {
    "message": "Hell",
    "description": "Light theme option"
  },
  "options_general_theme_dark": {
    "message": "Dunkel",
    "description": "Dark theme option"
  },
  "options_general_theme_system": {
    "message": "Systemeinstellung",
    "description": "System theme option"
  },
  "options_general_notifications": {
    "message": "Benachrichtigungen",
    "description": "Notifications toggle label"
  },
  "options_general_notifications_desc": {
    "message": "Benachrichtigungen beim Start und Ende von Sitzungen anzeigen",
    "description": "Notifications toggle description"
  },
  "options_general_badge": {
    "message": "Symbol-Badge",
    "description": "Badge icon toggle label"
  },
  "options_general_badge_desc": {
    "message": "Verbleibende Zeit im Erweiterungssymbol anzeigen",
    "description": "Badge icon description"
  },
  "options_general_startup": {
    "message": "Beim Browserstart starten",
    "description": "Auto-start on browser open"
  },
  "options_general_startup_desc": {
    "message": "Automatisch eine Fokus-Sitzung beim Offnen von Chrome starten",
    "description": "Auto-start description"
  },

  "options_timer_focus_duration": {
    "message": "Fokus-Dauer",
    "description": "Focus duration setting label"
  },
  "options_timer_focus_duration_desc": {
    "message": "Dauer jeder Fokus-Sitzung in Minuten",
    "description": "Focus duration description"
  },
  "options_timer_break_duration": {
    "message": "Pausendauer",
    "description": "Break duration setting label"
  },
  "options_timer_break_duration_desc": {
    "message": "Dauer jeder kurzen Pause in Minuten",
    "description": "Break duration description"
  },
  "options_timer_long_break": {
    "message": "Lange Pause",
    "description": "Long break duration label"
  },
  "options_timer_long_break_desc": {
    "message": "Dauer der langen Pause in Minuten",
    "description": "Long break duration description"
  },
  "options_timer_sessions_before_long": {
    "message": "Sitzungen vor langer Pause",
    "description": "Sessions before long break"
  },
  "options_timer_auto_start_break": {
    "message": "Pause automatisch starten",
    "description": "Auto-start break toggle"
  },
  "options_timer_auto_start_focus": {
    "message": "Fokus automatisch starten",
    "description": "Auto-start next focus toggle"
  },
  "options_timer_minutes_label": {
    "message": "Minuten",
    "description": "Minutes unit label"
  },

  "options_blocklist_title": {
    "message": "Blockierte Seiten",
    "description": "Blocklist section title"
  },
  "options_blocklist_add": {
    "message": "Seite hinzufugen",
    "description": "Add site button"
  },
  "options_blocklist_add_placeholder": {
    "message": "Domain eingeben (z.B. facebook.com)",
    "description": "Add site input placeholder"
  },
  "options_blocklist_remove": {
    "message": "Entfernen",
    "description": "Remove site button"
  },
  "options_blocklist_empty": {
    "message": "Keine blockierten Seiten. Fugen Sie Seiten hinzu, die wahrend der Fokus-Sitzungen blockiert werden sollen.",
    "description": "Empty blocklist message"
  },
  "options_blocklist_import": {
    "message": "Liste importieren",
    "description": "Import blocklist button"
  },
  "options_blocklist_export": {
    "message": "Liste exportieren",
    "description": "Export blocklist button"
  },
  "options_blocklist_preset": {
    "message": "Voreingestellte Listen",
    "description": "Preset blocklist button"
  },
  "options_blocklist_preset_social": {
    "message": "Soziale Medien",
    "description": "Social media preset"
  },
  "options_blocklist_preset_news": {
    "message": "Nachrichten",
    "description": "News sites preset"
  },
  "options_blocklist_preset_entertainment": {
    "message": "Unterhaltung",
    "description": "Entertainment preset"
  },
  "options_blocklist_preset_shopping": {
    "message": "Online-Shopping",
    "description": "Shopping sites preset"
  },
  "options_blocklist_always_block": {
    "message": "Immer blockieren",
    "description": "Always block toggle"
  },
  "options_blocklist_schedule": {
    "message": "Zeitplan fur Blockierung",
    "description": "Schedule-based blocking"
  },

  "options_nuclear_title": {
    "message": "Nuclear Mode Einstellungen",
    "description": "Nuclear Mode settings title"
  },
  "options_nuclear_desc": {
    "message": "Nuclear Mode blockiert alle Seiten auf Ihrer Liste ohne Moglichkeit, ihn vorzeitig zu deaktivieren.",
    "description": "Nuclear Mode description"
  },
  "options_nuclear_duration": {
    "message": "Nuclear Mode Dauer",
    "description": "Nuclear Mode duration label"
  },
  "options_nuclear_block_all": {
    "message": "Alle Seiten blockieren (nicht nur die Liste)",
    "description": "Block all sites option"
  },
  "options_nuclear_allowlist": {
    "message": "Erlaubte Seiten im Nuclear Mode",
    "description": "Nuclear Mode allowlist"
  },
  "options_nuclear_allowlist_add": {
    "message": "Erlaubte Seite hinzufugen",
    "description": "Add to Nuclear Mode allowlist"
  },
  "options_nuclear_warning": {
    "message": "Nuclear Mode kann nach der Aktivierung nicht deaktiviert werden. Mit Vorsicht verwenden.",
    "description": "Nuclear Mode warning"
  },
  "options_nuclear_confirm": {
    "message": "Aktivierung bestatigen",
    "description": "Confirm Nuclear Mode activation"
  },

  "options_sounds_title": {
    "message": "Umgebungsklange",
    "description": "Ambient sounds section title"
  },
  "options_sounds_enable": {
    "message": "Klange wahrend des Fokus aktivieren",
    "description": "Enable sounds toggle"
  },
  "options_sounds_volume": {
    "message": "Lautstarke",
    "description": "Volume slider label"
  },
  "options_sounds_rain": {
    "message": "Regen",
    "description": "Rain ambient sound"
  },
  "options_sounds_forest": {
    "message": "Wald",
    "description": "Forest ambient sound"
  },
  "options_sounds_cafe": {
    "message": "Cafe",
    "description": "Cafe ambient sound"
  },
  "options_sounds_ocean": {
    "message": "Meer",
    "description": "Ocean ambient sound"
  },
  "options_sounds_white_noise": {
    "message": "Weisses Rauschen",
    "description": "White noise"
  },
  "options_sounds_fireplace": {
    "message": "Kaminfeuer",
    "description": "Fireplace ambient sound"
  },
  "options_sounds_notification": {
    "message": "Benachrichtigungston",
    "description": "Notification sound selector"
  },
  "options_sounds_notification_chime": {
    "message": "Glockenspiel",
    "description": "Chime notification sound"
  },
  "options_sounds_notification_bell": {
    "message": "Glocke",
    "description": "Bell notification sound"
  },
  "options_sounds_notification_none": {
    "message": "Kein Ton",
    "description": "No notification sound"
  },

  "options_stats_title": {
    "message": "Statistiken",
    "description": "Statistics section title"
  },
  "options_stats_today": {
    "message": "Heute",
    "description": "Today tab"
  },
  "options_stats_week": {
    "message": "Diese Woche",
    "description": "This week tab"
  },
  "options_stats_month": {
    "message": "Dieser Monat",
    "description": "This month tab"
  },
  "options_stats_all_time": {
    "message": "Gesamtzeit",
    "description": "All time tab"
  },
  "options_stats_focus_time": {
    "message": "Fokuszeit",
    "description": "Focus time stat label"
  },
  "options_stats_sessions": {
    "message": "Abgeschlossene Sitzungen",
    "description": "Completed sessions stat"
  },
  "options_stats_blocked": {
    "message": "Blockierte Seiten",
    "description": "Sites blocked stat"
  },
  "options_stats_streak": {
    "message": "Langste Serie",
    "description": "Best streak stat"
  },
  "options_stats_avg_score": {
    "message": "Durchschnittlicher Focus Score",
    "description": "Average Focus Score"
  },
  "options_stats_export": {
    "message": "Daten exportieren",
    "description": "Export statistics data"
  },
  "options_stats_reset": {
    "message": "Statistiken zurucksetzen",
    "description": "Reset statistics button"
  },
  "options_stats_reset_confirm": {
    "message": "Alle Statistiken werden dauerhaft geloscht. Dies kann nicht ruckgangig gemacht werden.",
    "description": "Reset confirmation message"
  },

  "options_account_title": {
    "message": "Konto",
    "description": "Account section title"
  },
  "options_account_plan_free": {
    "message": "Kostenloser Plan",
    "description": "Free plan label"
  },
  "options_account_plan_pro": {
    "message": "Focus Mode Pro",
    "description": "Pro plan label"
  },
  "options_account_upgrade": {
    "message": "Auf Pro upgraden",
    "description": "Upgrade button"
  },
  "options_account_manage": {
    "message": "Abonnement verwalten",
    "description": "Manage subscription link"
  },
  "options_account_restore": {
    "message": "Kauf wiederherstellen",
    "description": "Restore purchase button"
  },
  "options_account_data_sync": {
    "message": "Datensynchronisierung",
    "description": "Data sync toggle"
  },
  "options_account_data_sync_desc": {
    "message": "Einstellungen zwischen Geraten synchronisieren (Pro erforderlich)",
    "description": "Data sync description"
  },

  "options_about_title": {
    "message": "Uber Focus Mode",
    "description": "About section title"
  },
  "options_about_version": {
    "message": "Version $VERSION$",
    "description": "Version display",
    "placeholders": {
      "version": { "content": "$1", "example": "1.0.0" }
    }
  },
  "options_about_developer": {
    "message": "Entwickelt von Zovo",
    "description": "Developer credit"
  },
  "options_about_rate": {
    "message": "Im Chrome Web Store bewerten",
    "description": "Rate extension link"
  },
  "options_about_feedback": {
    "message": "Feedback senden",
    "description": "Feedback link"
  },
  "options_about_privacy": {
    "message": "Datenschutzrichtlinie",
    "description": "Privacy policy link"
  },
  "options_about_terms": {
    "message": "Nutzungsbedingungen",
    "description": "Terms of service link"
  },
  "options_about_changelog": {
    "message": "Anderungsprotokoll",
    "description": "Changelog link"
  },
  "options_about_support": {
    "message": "Hilfe-Center",
    "description": "Support/help center link"
  },

  "block_page_title": {
    "message": "Seite blockiert",
    "description": "Block page title"
  },
  "block_page_heading": {
    "message": "Diese Seite ist blockiert",
    "description": "Block page main heading"
  },
  "block_page_description": {
    "message": "$SITE$ ist wahrend Ihrer Fokus-Sitzung blockiert. Bleiben Sie bei dem, was zahlt.",
    "description": "Block page description",
    "placeholders": {
      "site": { "content": "$1", "example": "facebook.com" }
    }
  },
  "block_page_time_remaining": {
    "message": "Verbleibende Zeit: $TIME$",
    "description": "Time remaining on block page",
    "placeholders": {
      "time": { "content": "$1", "example": "18:32" }
    }
  },
  "block_page_nuclear_active": {
    "message": "Nuclear Mode ist aktiv. Diese Seite kann nicht entsperrt werden.",
    "description": "Nuclear Mode active message"
  },
  "block_page_btn_go_back": {
    "message": "Zuruck",
    "description": "Go back button on block page"
  },
  "block_page_btn_dashboard": {
    "message": "Zum Dashboard",
    "description": "Go to dashboard button"
  },
  "block_page_focus_score": {
    "message": "Ihr Focus Score: $SCORE$",
    "description": "Focus Score display on block page",
    "placeholders": {
      "score": { "content": "$1", "example": "85" }
    }
  },
  "block_page_sessions_today": {
    "message": "Sitzungen heute: $COUNT$",
    "description": "Sessions today on block page",
    "placeholders": {
      "count": { "content": "$1", "example": "3" }
    }
  },
  "block_page_streak": {
    "message": "Aktuelle Serie: $DAYS$ Tage",
    "description": "Current streak on block page",
    "placeholders": {
      "days": { "content": "$1", "example": "7" }
    }
  },

  "block_page_quote_1": {
    "message": "Disziplin ist die Brucke zwischen Zielen und Erfolgen.",
    "description": "Motivational quote 1 — Jim Rohn"
  },
  "block_page_quote_2": {
    "message": "Erfolg ist die Summe kleiner Anstrengungen, die Tag fur Tag wiederholt werden.",
    "description": "Motivational quote 2 — Robert Collier"
  },
  "block_page_quote_3": {
    "message": "Konzentriere dich darauf, produktiv zu sein, nicht beschaftigt.",
    "description": "Motivational quote 3 — Tim Ferriss"
  },
  "block_page_quote_4": {
    "message": "Konzentration ist die Wurzel aller menschlichen Fahigkeiten.",
    "description": "Motivational quote 4 — Bruce Lee"
  },
  "block_page_quote_5": {
    "message": "Es ist nicht so, dass wir wenig Zeit haben, sondern dass wir viel verschwenden.",
    "description": "Motivational quote 5 — Seneca"
  },
  "block_page_quote_6": {
    "message": "Die Zukunft hangt davon ab, was du heute tust.",
    "description": "Motivational quote 6 — Mahatma Gandhi"
  },
  "block_page_quote_7": {
    "message": "Wo Fokus ist, da ist Kraft.",
    "description": "Motivational quote 7 — Tony Robbins"
  },
  "block_page_quote_8": {
    "message": "Der beste Weg, die Zukunft vorherzusagen, ist sie zu erschaffen.",
    "description": "Motivational quote 8 — Peter Drucker"
  },
  "block_page_quote_9": {
    "message": "Jeder Moment ist eine neue Gelegenheit, dein Leben zu verandern.",
    "description": "Motivational quote 9"
  },
  "block_page_quote_10": {
    "message": "Tu heute das, was andere nicht wollen, damit du morgen hast, was andere nicht haben.",
    "description": "Motivational quote 10"
  },

  "onboarding_welcome_title": {
    "message": "Willkommen bei Focus Mode",
    "description": "Onboarding slide 1 title"
  },
  "onboarding_welcome_desc": {
    "message": "Blockieren Sie Ablenkungen, steigern Sie Ihre Produktivitat und erreichen Sie Ihre Ziele mit strukturierten Fokus-Sitzungen.",
    "description": "Onboarding slide 1 description"
  },
  "onboarding_blocklist_title": {
    "message": "Richten Sie Ihre Sperrliste ein",
    "description": "Onboarding slide 2 title"
  },
  "onboarding_blocklist_desc": {
    "message": "Fugen Sie ablenkende Websites hinzu. Wir blockieren sie wahrend Ihrer Fokus-Sitzungen, damit Sie sich konzentrieren konnen.",
    "description": "Onboarding slide 2 description"
  },
  "onboarding_timer_title": {
    "message": "Passen Sie Ihren Timer an",
    "description": "Onboarding slide 3 title"
  },
  "onboarding_timer_desc": {
    "message": "Stellen Sie die Dauer Ihrer Fokus-Sitzungen und Pausen ein. Nutzen Sie die Pomodoro-Technik oder erstellen Sie Ihren eigenen Rhythmus.",
    "description": "Onboarding slide 3 description"
  },
  "onboarding_score_title": {
    "message": "Lernen Sie Ihren Focus Score kennen",
    "description": "Onboarding slide 4 title"
  },
  "onboarding_score_desc": {
    "message": "Ihr Focus Score (0-100) misst Ihre Konzentration. Schliessen Sie Sitzungen ab, vermeiden Sie Ablenkungen und bauen Sie Serien auf, um Ihren Score zu verbessern.",
    "description": "Onboarding slide 4 description"
  },
  "onboarding_ready_title": {
    "message": "Bereit zum Fokussieren",
    "description": "Onboarding slide 5 title"
  },
  "onboarding_ready_desc": {
    "message": "Alles ist eingerichtet. Starten Sie Ihre erste Fokus-Sitzung und werden Sie jetzt produktiver.",
    "description": "Onboarding slide 5 description"
  },
  "onboarding_btn_next": {
    "message": "Weiter",
    "description": "Next button in onboarding"
  },
  "onboarding_btn_skip": {
    "message": "Uberspringen",
    "description": "Skip button in onboarding"
  },
  "onboarding_btn_back": {
    "message": "Zuruck",
    "description": "Back button in onboarding"
  },
  "onboarding_btn_get_started": {
    "message": "Loslegen",
    "description": "Get started button"
  },
  "onboarding_btn_add_sites": {
    "message": "Seiten hinzufugen",
    "description": "Add sites button in onboarding"
  },
  "onboarding_progress": {
    "message": "$CURRENT$ von $TOTAL$",
    "description": "Onboarding progress indicator",
    "placeholders": {
      "current": { "content": "$1", "example": "2" },
      "total": { "content": "$2", "example": "5" }
    }
  },

  "notification_focus_started": {
    "message": "Fokus-Sitzung gestartet. $MINS$ Minuten Konzentration.",
    "description": "Focus session started notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "25" }
    }
  },
  "notification_focus_complete": {
    "message": "Fokus-Sitzung abgeschlossen. Hervorragende Arbeit.",
    "description": "Focus session complete notification"
  },
  "notification_break_started": {
    "message": "Pausenzeit. Entspannen Sie sich fur $MINS$ Minuten.",
    "description": "Break started notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "5" }
    }
  },
  "notification_break_over": {
    "message": "Pause vorbei. Bereit fur die nachste Sitzung.",
    "description": "Break over notification"
  },
  "notification_nuclear_started": {
    "message": "Nuclear Mode fur $MINS$ Minuten aktiviert. Alle Seiten sind blockiert.",
    "description": "Nuclear Mode started notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "60" }
    }
  },
  "notification_nuclear_ended": {
    "message": "Nuclear Mode beendet. Seiten wurden entsperrt.",
    "description": "Nuclear Mode ended notification"
  },
  "notification_streak_milestone": {
    "message": "Serie von $DAYS$ Tagen. Weiter so!",
    "description": "Streak milestone notification",
    "placeholders": {
      "days": { "content": "$1", "example": "7" }
    }
  },
  "notification_score_improved": {
    "message": "Ihr Focus Score ist auf $SCORE$ gestiegen.",
    "description": "Focus Score improvement notification",
    "placeholders": {
      "score": { "content": "$1", "example": "90" }
    }
  },
  "notification_daily_goal": {
    "message": "Tagesziel erreicht. Sie haben heute $COUNT$ Sitzungen abgeschlossen.",
    "description": "Daily goal completed notification",
    "placeholders": {
      "count": { "content": "$1", "example": "4" }
    }
  },

  "error_invalid_url": {
    "message": "Ungultige URL. Bitte geben Sie eine korrekte Domain ein.",
    "description": "Invalid URL error"
  },
  "error_duplicate_site": {
    "message": "Diese Seite befindet sich bereits auf der Sperrliste.",
    "description": "Duplicate site error"
  },
  "error_storage_full": {
    "message": "Speicher voll. Loschen Sie einige Daten, um fortzufahren.",
    "description": "Storage full error"
  },
  "error_network": {
    "message": "Verbindungsfehler. Uberprufen Sie Ihre Internetverbindung.",
    "description": "Network error"
  },
  "error_generic": {
    "message": "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    "description": "Generic error message"
  },
  "error_permission_denied": {
    "message": "Zugriff verweigert. Uberprufen Sie die Erweiterungsberechtigungen.",
    "description": "Permission denied error"
  },
  "error_session_conflict": {
    "message": "Es lauft bereits eine Sitzung.",
    "description": "Session conflict error"
  },
  "error_nuclear_active": {
    "message": "Einstellungen konnen wahrend des Nuclear Mode nicht geandert werden.",
    "description": "Cannot modify during Nuclear Mode"
  },
  "error_import_invalid": {
    "message": "Ungultige Importdatei.",
    "description": "Invalid import file error"
  },
  "error_export_failed": {
    "message": "Datenexport fehlgeschlagen.",
    "description": "Export failed error"
  },

  "paywall_title": {
    "message": "Focus Mode Pro freischalten",
    "description": "Paywall title (T1)"
  },
  "paywall_subtitle": {
    "message": "Bringen Sie Ihre Produktivitat auf die nachste Stufe",
    "description": "Paywall subtitle (T2)"
  },
  "paywall_feature_1": {
    "message": "Unbegrenzte blockierte Seiten",
    "description": "Pro feature 1 (T3)"
  },
  "paywall_feature_2": {
    "message": "Detaillierte Statistiken und Diagramme",
    "description": "Pro feature 2 (T4)"
  },
  "paywall_feature_3": {
    "message": "Erweiterter Nuclear Mode",
    "description": "Pro feature 3 (T5)"
  },
  "paywall_feature_4": {
    "message": "Premium-Umgebungsklange",
    "description": "Pro feature 4 (T6)"
  },
  "paywall_feature_5": {
    "message": "Gerateübergreifende Synchronisierung",
    "description": "Pro feature 5 (T7)"
  },
  "paywall_feature_6": {
    "message": "Benutzerdefinierter Blockierungszeitplan",
    "description": "Pro feature 6 (T8)"
  },
  "paywall_price_monthly": {
    "message": "$PRICE$/Monat",
    "description": "Monthly price display (T9)",
    "placeholders": {
      "price": { "content": "$1", "example": "4,99 €" }
    }
  },
  "paywall_price_lifetime": {
    "message": "$PRICE$ einmalige Zahlung",
    "description": "Lifetime price display (T10)",
    "placeholders": {
      "price": { "content": "$1", "example": "49,99 €" }
    }
  },
  "paywall_btn_subscribe": {
    "message": "Pro abonnieren",
    "description": "Subscribe button"
  },
  "paywall_btn_lifetime": {
    "message": "Lebenslang kaufen",
    "description": "Lifetime purchase button"
  },
  "paywall_btn_restore": {
    "message": "Kauf wiederherstellen",
    "description": "Restore purchase button"
  },
  "paywall_guarantee": {
    "message": "30 Tage Geld-zuruck-Garantie",
    "description": "Money-back guarantee"
  },
  "paywall_trial": {
    "message": "7 Tage kostenlos testen",
    "description": "Free trial text"
  },
  "paywall_cancel_anytime": {
    "message": "Jederzeit kundbar",
    "description": "Cancel anytime text"
  },

  "achievement_first_session": {
    "message": "Erste Sitzung abgeschlossen",
    "description": "First session achievement"
  },
  "achievement_ten_sessions": {
    "message": "10 Sitzungen abgeschlossen",
    "description": "10 sessions achievement"
  },
  "achievement_hundred_sessions": {
    "message": "100 Sitzungen abgeschlossen",
    "description": "100 sessions achievement"
  },
  "achievement_first_streak": {
    "message": "Erste 3-Tage-Serie",
    "description": "First 3-day streak"
  },
  "achievement_week_streak": {
    "message": "7-Tage-Serie",
    "description": "7-day streak achievement"
  },
  "achievement_month_streak": {
    "message": "30-Tage-Serie",
    "description": "30-day streak achievement"
  },
  "achievement_focus_master": {
    "message": "Focus Score von 90+",
    "description": "Focus Score 90+ achievement"
  },
  "achievement_nuclear_survivor": {
    "message": "Nuclear Mode uberstanden",
    "description": "Completed Nuclear Mode session"
  },
  "achievement_early_bird": {
    "message": "Fruhaufsteher — Sitzung vor 7 Uhr",
    "description": "Early bird achievement"
  },
  "achievement_night_owl": {
    "message": "Nachteule — Sitzung nach 23 Uhr",
    "description": "Night owl achievement"
  },
  "achievement_unlocked": {
    "message": "Erfolg freigeschaltet: $NAME$",
    "description": "Achievement unlocked notification",
    "placeholders": {
      "name": { "content": "$1", "example": "Erste Sitzung" }
    }
  },

  "streak_lost": {
    "message": "Serie verloren. Starten Sie heute eine neue.",
    "description": "Streak lost message"
  },
  "streak_at_risk": {
    "message": "Ihre $DAYS$-Tage-Serie ist gefahrdet. Schliessen Sie heute eine Sitzung ab.",
    "description": "Streak at risk warning",
    "placeholders": {
      "days": { "content": "$1", "example": "5" }
    }
  },
  "streak_protected": {
    "message": "Serie geschutzt (Pro)",
    "description": "Streak protection Pro feature"
  },
  "streak_frozen": {
    "message": "Serie fur heute eingefroren",
    "description": "Streak freeze active"
  },
  "streak_new_record": {
    "message": "Neuer Serien-Rekord: $DAYS$ Tage",
    "description": "New streak record",
    "placeholders": {
      "days": { "content": "$1", "example": "14" }
    }
  },

  "common_save": {
    "message": "Speichern",
    "description": "Save button"
  },
  "common_cancel": {
    "message": "Abbrechen",
    "description": "Cancel button"
  },
  "common_confirm": {
    "message": "Bestatigen",
    "description": "Confirm button"
  },
  "common_delete": {
    "message": "Loschen",
    "description": "Delete button"
  },
  "common_edit": {
    "message": "Bearbeiten",
    "description": "Edit button"
  },
  "common_close": {
    "message": "Schliessen",
    "description": "Close button"
  },
  "common_done": {
    "message": "Fertig",
    "description": "Done button"
  },
  "common_loading": {
    "message": "Wird geladen...",
    "description": "Loading state"
  },
  "common_enabled": {
    "message": "Aktiviert",
    "description": "Enabled state"
  },
  "common_disabled": {
    "message": "Deaktiviert",
    "description": "Disabled state"
  },
  "common_on": {
    "message": "Ein",
    "description": "On toggle state"
  },
  "common_off": {
    "message": "Aus",
    "description": "Off toggle state"
  },
  "common_yes": {
    "message": "Ja",
    "description": "Yes"
  },
  "common_no": {
    "message": "Nein",
    "description": "No"
  },
  "common_ok": {
    "message": "OK",
    "description": "OK button"
  },
  "common_reset": {
    "message": "Zurucksetzen",
    "description": "Reset button"
  },
  "common_retry": {
    "message": "Erneut versuchen",
    "description": "Retry button"
  },
  "common_learn_more": {
    "message": "Mehr erfahren",
    "description": "Learn more link"
  },
  "common_pro_badge": {
    "message": "Pro",
    "description": "Pro badge label — brand term"
  },
  "common_free_badge": {
    "message": "Kostenlos",
    "description": "Free badge label"
  },
  "common_new_badge": {
    "message": "Neu",
    "description": "New badge label"
  },
  "common_hours": {
    "message": "$COUNT$ Std.",
    "description": "Hours abbreviation",
    "placeholders": {
      "count": { "content": "$1", "example": "2" }
    }
  },
  "common_minutes": {
    "message": "$COUNT$ Min.",
    "description": "Minutes abbreviation",
    "placeholders": {
      "count": { "content": "$1", "example": "30" }
    }
  },
  "common_seconds": {
    "message": "$COUNT$ Sek.",
    "description": "Seconds abbreviation",
    "placeholders": {
      "count": { "content": "$1", "example": "45" }
    }
  },
  "common_days": {
    "message": "$COUNT$ Tage",
    "description": "Days with count",
    "placeholders": {
      "count": { "content": "$1", "example": "7" }
    }
  },
  "common_today": {
    "message": "Heute",
    "description": "Today"
  },
  "common_yesterday": {
    "message": "Gestern",
    "description": "Yesterday"
  },
  "common_this_week": {
    "message": "Diese Woche",
    "description": "This week"
  },
  "common_all_time": {
    "message": "Gesamtzeit",
    "description": "All time"
  }
}
```

**German translation notes:**
- Total entries: 210+
- German compounds formed naturally (Fokus-Sitzung, Sperrliste, Umgebungsklange)
- Formal Sie-form used for direct address in longer strings; impersonal forms in buttons
- Text expansion managed by using German-standard abbreviations (Min., Std., Sek.)
- Nuclear Mode and Focus Score kept in English as brand terms; German context words wrap naturally around them

---

## 3. Japanese (ja) — Complete messages.json

**Locale:** `_locales/ja/messages.json`
**Target markets:** Japan
**Register:** Polite (desu/masu form), appropriate keigo for UI
**Note:** Japanese text is typically more concise than English. Katakana used for established loanwords; kanji/hiragana for native terms.

```json
{
  "_locale_metadata": {
    "message": "ja",
    "description": "Japanese locale metadata"
  },

  "extension_name": {
    "message": "Focus Mode - Blocker",
    "description": "Extension name — brand term, do not translate"
  },
  "extension_description": {
    "message": "気が散るウェブサイトをブロック、ポモドーロタイマー、Focus Score、Nuclear Mode搭載。集中力と生産性を高めましょう。",
    "description": "Chrome Web Store extension description"
  },
  "extension_short_description": {
    "message": "気が散るサイトをブロック。集中を維持。",
    "description": "Short tagline for the extension"
  },

  "popup_title": {
    "message": "Focus Mode",
    "description": "Popup header title — brand term"
  },
  "popup_state_idle": {
    "message": "集中の準備完了",
    "description": "Popup state when no session is active"
  },
  "popup_state_focus": {
    "message": "集中セッション中",
    "description": "Popup state during focus session"
  },
  "popup_state_break": {
    "message": "休憩時間",
    "description": "Popup state during break"
  },
  "popup_state_long_break": {
    "message": "長い休憩",
    "description": "Popup state during long break"
  },
  "popup_state_nuclear": {
    "message": "Nuclear Mode 有効",
    "description": "Popup state when Nuclear Mode is engaged"
  },
  "popup_state_paused": {
    "message": "セッション一時停止中",
    "description": "Popup state when session is paused"
  },

  "popup_btn_start_focus": {
    "message": "集中開始",
    "description": "Button to start a focus session"
  },
  "popup_btn_stop": {
    "message": "停止",
    "description": "Button to stop current session"
  },
  "popup_btn_pause": {
    "message": "一時停止",
    "description": "Button to pause current session"
  },
  "popup_btn_resume": {
    "message": "再開",
    "description": "Button to resume paused session"
  },
  "popup_btn_skip_break": {
    "message": "休憩をスキップ",
    "description": "Button to skip break and start next focus"
  },
  "popup_btn_start_break": {
    "message": "休憩開始",
    "description": "Button to start a break"
  },
  "popup_btn_nuclear": {
    "message": "Nuclear Mode を有効化",
    "description": "Button to activate Nuclear Mode"
  },
  "popup_btn_settings": {
    "message": "設定",
    "description": "Button to open settings/options page"
  },
  "popup_btn_upgrade": {
    "message": "Pro にアップグレード",
    "description": "Button to upgrade to Pro"
  },

  "popup_timer_minutes": {
    "message": "$MINS$分",
    "description": "Timer display in minutes",
    "placeholders": {
      "mins": { "content": "$1", "example": "25" }
    }
  },
  "popup_timer_seconds": {
    "message": "$MINS$:$SECS$",
    "description": "Timer display mm:ss",
    "placeholders": {
      "mins": { "content": "$1", "example": "24" },
      "secs": { "content": "$2", "example": "59" }
    }
  },
  "popup_sessions_today": {
    "message": "今日のセッション: $COUNT$回",
    "description": "Number of focus sessions completed today",
    "placeholders": {
      "count": { "content": "$1", "example": "4" }
    }
  },
  "popup_focus_score_label": {
    "message": "Focus Score",
    "description": "Label for Focus Score display — brand term"
  },
  "popup_focus_score_value": {
    "message": "$SCORE$/100",
    "description": "Focus Score numeric display",
    "placeholders": {
      "score": { "content": "$1", "example": "85" }
    }
  },
  "popup_streak_label": {
    "message": "連続記録",
    "description": "Label for streak counter"
  },
  "popup_streak_days": {
    "message": "$COUNT$日間",
    "description": "Streak day count",
    "placeholders": {
      "count": { "content": "$1", "example": "7" }
    }
  },
  "popup_quick_block": {
    "message": "クイックブロック",
    "description": "Quick block site button"
  },
  "popup_blocked_count": {
    "message": "$COUNT$サイトをブロック中",
    "description": "Number of blocked sites",
    "placeholders": {
      "count": { "content": "$1", "example": "12" }
    }
  },
  "popup_focus_time_today": {
    "message": "今日の集中時間: $TIME$",
    "description": "Total focus time today",
    "placeholders": {
      "time": { "content": "$1", "example": "2h 15m" }
    }
  },

  "options_title": {
    "message": "Focus Mode 設定",
    "description": "Options page title"
  },
  "options_nav_general": {
    "message": "一般",
    "description": "Options navigation — general section"
  },
  "options_nav_timer": {
    "message": "タイマー",
    "description": "Options navigation — timer section"
  },
  "options_nav_blocklist": {
    "message": "ブロックリスト",
    "description": "Options navigation — blocklist section"
  },
  "options_nav_nuclear": {
    "message": "Nuclear Mode",
    "description": "Options navigation — Nuclear Mode section"
  },
  "options_nav_sounds": {
    "message": "サウンド",
    "description": "Options navigation — sounds section"
  },
  "options_nav_stats": {
    "message": "統計",
    "description": "Options navigation — statistics section"
  },
  "options_nav_account": {
    "message": "アカウント",
    "description": "Options navigation — account section"
  },
  "options_nav_about": {
    "message": "このアプリについて",
    "description": "Options navigation — about section"
  },

  "options_general_language": {
    "message": "言語",
    "description": "Language selector label"
  },
  "options_general_language_auto": {
    "message": "自動（ブラウザの言語）",
    "description": "Auto-detect language option"
  },
  "options_general_theme": {
    "message": "テーマ",
    "description": "Theme selector label"
  },
  "options_general_theme_light": {
    "message": "ライト",
    "description": "Light theme option"
  },
  "options_general_theme_dark": {
    "message": "ダーク",
    "description": "Dark theme option"
  },
  "options_general_theme_system": {
    "message": "システム設定",
    "description": "System theme option"
  },
  "options_general_notifications": {
    "message": "通知",
    "description": "Notifications toggle label"
  },
  "options_general_notifications_desc": {
    "message": "セッションの開始と終了時に通知を表示します",
    "description": "Notifications toggle description"
  },
  "options_general_badge": {
    "message": "バッジアイコン",
    "description": "Badge icon toggle label"
  },
  "options_general_badge_desc": {
    "message": "拡張機能のアイコンに残り時間を表示します",
    "description": "Badge icon description"
  },
  "options_general_startup": {
    "message": "ブラウザ起動時に開始",
    "description": "Auto-start on browser open"
  },
  "options_general_startup_desc": {
    "message": "Chrome起動時に自動的に集中セッションを開始します",
    "description": "Auto-start description"
  },

  "options_timer_focus_duration": {
    "message": "集中時間",
    "description": "Focus duration setting label"
  },
  "options_timer_focus_duration_desc": {
    "message": "各集中セッションの長さ（分）",
    "description": "Focus duration description"
  },
  "options_timer_break_duration": {
    "message": "休憩時間",
    "description": "Break duration setting label"
  },
  "options_timer_break_duration_desc": {
    "message": "各短い休憩の長さ（分）",
    "description": "Break duration description"
  },
  "options_timer_long_break": {
    "message": "長い休憩",
    "description": "Long break duration label"
  },
  "options_timer_long_break_desc": {
    "message": "長い休憩の長さ（分）",
    "description": "Long break duration description"
  },
  "options_timer_sessions_before_long": {
    "message": "長い休憩までのセッション数",
    "description": "Sessions before long break"
  },
  "options_timer_auto_start_break": {
    "message": "休憩を自動開始",
    "description": "Auto-start break toggle"
  },
  "options_timer_auto_start_focus": {
    "message": "集中を自動開始",
    "description": "Auto-start next focus toggle"
  },
  "options_timer_minutes_label": {
    "message": "分",
    "description": "Minutes unit label"
  },

  "options_blocklist_title": {
    "message": "ブロック中のサイト",
    "description": "Blocklist section title"
  },
  "options_blocklist_add": {
    "message": "サイトを追加",
    "description": "Add site button"
  },
  "options_blocklist_add_placeholder": {
    "message": "ドメインを入力（例: facebook.com）",
    "description": "Add site input placeholder"
  },
  "options_blocklist_remove": {
    "message": "削除",
    "description": "Remove site button"
  },
  "options_blocklist_empty": {
    "message": "ブロック中のサイトはありません。集中セッション中にブロックするサイトを追加してください。",
    "description": "Empty blocklist message"
  },
  "options_blocklist_import": {
    "message": "リストをインポート",
    "description": "Import blocklist button"
  },
  "options_blocklist_export": {
    "message": "リストをエクスポート",
    "description": "Export blocklist button"
  },
  "options_blocklist_preset": {
    "message": "プリセットリスト",
    "description": "Preset blocklist button"
  },
  "options_blocklist_preset_social": {
    "message": "SNS",
    "description": "Social media preset"
  },
  "options_blocklist_preset_news": {
    "message": "ニュース",
    "description": "News sites preset"
  },
  "options_blocklist_preset_entertainment": {
    "message": "エンタメ",
    "description": "Entertainment preset"
  },
  "options_blocklist_preset_shopping": {
    "message": "ショッピング",
    "description": "Shopping sites preset"
  },
  "options_blocklist_always_block": {
    "message": "常にブロック",
    "description": "Always block toggle"
  },
  "options_blocklist_schedule": {
    "message": "ブロックスケジュール",
    "description": "Schedule-based blocking"
  },

  "options_nuclear_title": {
    "message": "Nuclear Mode 設定",
    "description": "Nuclear Mode settings title"
  },
  "options_nuclear_desc": {
    "message": "Nuclear Modeはリスト上のすべてのサイトをブロックし、終了時間まで無効化できません。",
    "description": "Nuclear Mode description"
  },
  "options_nuclear_duration": {
    "message": "Nuclear Mode の継続時間",
    "description": "Nuclear Mode duration label"
  },
  "options_nuclear_block_all": {
    "message": "すべてのサイトをブロック（リストだけではなく）",
    "description": "Block all sites option"
  },
  "options_nuclear_allowlist": {
    "message": "Nuclear Mode 中に許可するサイト",
    "description": "Nuclear Mode allowlist"
  },
  "options_nuclear_allowlist_add": {
    "message": "許可サイトを追加",
    "description": "Add to Nuclear Mode allowlist"
  },
  "options_nuclear_warning": {
    "message": "Nuclear Mode は一度有効にすると無効化できません。ご注意ください。",
    "description": "Nuclear Mode warning"
  },
  "options_nuclear_confirm": {
    "message": "有効化を確認",
    "description": "Confirm Nuclear Mode activation"
  },

  "options_sounds_title": {
    "message": "環境音",
    "description": "Ambient sounds section title"
  },
  "options_sounds_enable": {
    "message": "集中中にサウンドを有効化",
    "description": "Enable sounds toggle"
  },
  "options_sounds_volume": {
    "message": "音量",
    "description": "Volume slider label"
  },
  "options_sounds_rain": {
    "message": "雨",
    "description": "Rain ambient sound"
  },
  "options_sounds_forest": {
    "message": "森",
    "description": "Forest ambient sound"
  },
  "options_sounds_cafe": {
    "message": "カフェ",
    "description": "Cafe ambient sound"
  },
  "options_sounds_ocean": {
    "message": "海",
    "description": "Ocean ambient sound"
  },
  "options_sounds_white_noise": {
    "message": "ホワイトノイズ",
    "description": "White noise"
  },
  "options_sounds_fireplace": {
    "message": "暖炉",
    "description": "Fireplace ambient sound"
  },
  "options_sounds_notification": {
    "message": "通知音",
    "description": "Notification sound selector"
  },
  "options_sounds_notification_chime": {
    "message": "チャイム",
    "description": "Chime notification sound"
  },
  "options_sounds_notification_bell": {
    "message": "ベル",
    "description": "Bell notification sound"
  },
  "options_sounds_notification_none": {
    "message": "なし",
    "description": "No notification sound"
  },

  "options_stats_title": {
    "message": "統計",
    "description": "Statistics section title"
  },
  "options_stats_today": {
    "message": "今日",
    "description": "Today tab"
  },
  "options_stats_week": {
    "message": "今週",
    "description": "This week tab"
  },
  "options_stats_month": {
    "message": "今月",
    "description": "This month tab"
  },
  "options_stats_all_time": {
    "message": "全期間",
    "description": "All time tab"
  },
  "options_stats_focus_time": {
    "message": "集中時間",
    "description": "Focus time stat label"
  },
  "options_stats_sessions": {
    "message": "完了セッション数",
    "description": "Completed sessions stat"
  },
  "options_stats_blocked": {
    "message": "ブロック回数",
    "description": "Sites blocked stat"
  },
  "options_stats_streak": {
    "message": "最長連続記録",
    "description": "Best streak stat"
  },
  "options_stats_avg_score": {
    "message": "平均 Focus Score",
    "description": "Average Focus Score"
  },
  "options_stats_export": {
    "message": "データをエクスポート",
    "description": "Export statistics data"
  },
  "options_stats_reset": {
    "message": "統計をリセット",
    "description": "Reset statistics button"
  },
  "options_stats_reset_confirm": {
    "message": "すべての統計データが完全に削除されます。この操作は取り消せません。",
    "description": "Reset confirmation message"
  },

  "options_account_title": {
    "message": "アカウント",
    "description": "Account section title"
  },
  "options_account_plan_free": {
    "message": "無料プラン",
    "description": "Free plan label"
  },
  "options_account_plan_pro": {
    "message": "Focus Mode Pro",
    "description": "Pro plan label"
  },
  "options_account_upgrade": {
    "message": "Pro にアップグレード",
    "description": "Upgrade button"
  },
  "options_account_manage": {
    "message": "サブスクリプション管理",
    "description": "Manage subscription link"
  },
  "options_account_restore": {
    "message": "購入を復元",
    "description": "Restore purchase button"
  },
  "options_account_data_sync": {
    "message": "データ同期",
    "description": "Data sync toggle"
  },
  "options_account_data_sync_desc": {
    "message": "デバイス間で設定を同期（Pro が必要）",
    "description": "Data sync description"
  },

  "options_about_title": {
    "message": "Focus Mode について",
    "description": "About section title"
  },
  "options_about_version": {
    "message": "バージョン $VERSION$",
    "description": "Version display",
    "placeholders": {
      "version": { "content": "$1", "example": "1.0.0" }
    }
  },
  "options_about_developer": {
    "message": "開発: Zovo",
    "description": "Developer credit"
  },
  "options_about_rate": {
    "message": "Chrome ウェブストアで評価する",
    "description": "Rate extension link"
  },
  "options_about_feedback": {
    "message": "フィードバックを送信",
    "description": "Feedback link"
  },
  "options_about_privacy": {
    "message": "プライバシーポリシー",
    "description": "Privacy policy link"
  },
  "options_about_terms": {
    "message": "利用規約",
    "description": "Terms of service link"
  },
  "options_about_changelog": {
    "message": "変更履歴",
    "description": "Changelog link"
  },
  "options_about_support": {
    "message": "ヘルプセンター",
    "description": "Support/help center link"
  },

  "block_page_title": {
    "message": "サイトがブロックされています",
    "description": "Block page title"
  },
  "block_page_heading": {
    "message": "このサイトはブロックされています",
    "description": "Block page main heading"
  },
  "block_page_description": {
    "message": "$SITE$ は集中セッション中にブロックされています。大切なことに集中しましょう。",
    "description": "Block page description",
    "placeholders": {
      "site": { "content": "$1", "example": "facebook.com" }
    }
  },
  "block_page_time_remaining": {
    "message": "残り時間: $TIME$",
    "description": "Time remaining on block page",
    "placeholders": {
      "time": { "content": "$1", "example": "18:32" }
    }
  },
  "block_page_nuclear_active": {
    "message": "Nuclear Mode が有効です。このサイトのブロックを解除できません。",
    "description": "Nuclear Mode active message"
  },
  "block_page_btn_go_back": {
    "message": "戻る",
    "description": "Go back button on block page"
  },
  "block_page_btn_dashboard": {
    "message": "ダッシュボードへ",
    "description": "Go to dashboard button"
  },
  "block_page_focus_score": {
    "message": "あなたの Focus Score: $SCORE$",
    "description": "Focus Score display on block page",
    "placeholders": {
      "score": { "content": "$1", "example": "85" }
    }
  },
  "block_page_sessions_today": {
    "message": "今日のセッション: $COUNT$回",
    "description": "Sessions today on block page",
    "placeholders": {
      "count": { "content": "$1", "example": "3" }
    }
  },
  "block_page_streak": {
    "message": "現在の連続記録: $DAYS$日間",
    "description": "Current streak on block page",
    "placeholders": {
      "days": { "content": "$1", "example": "7" }
    }
  },

  "block_page_quote_1": {
    "message": "千里の道も一歩から。",
    "description": "Motivational quote 1 — Lao Tzu (Japanese proverb form)"
  },
  "block_page_quote_2": {
    "message": "継続は力なり。",
    "description": "Motivational quote 2 — Japanese proverb"
  },
  "block_page_quote_3": {
    "message": "集中することが、人間の能力の根源である。",
    "description": "Motivational quote 3 — Bruce Lee"
  },
  "block_page_quote_4": {
    "message": "今日できることを明日に延ばすな。",
    "description": "Motivational quote 4 — Benjamin Franklin (Japanese adaptation)"
  },
  "block_page_quote_5": {
    "message": "未来は今日始まる、明日ではない。",
    "description": "Motivational quote 5 — Pope John Paul II"
  },
  "block_page_quote_6": {
    "message": "七転び八起き。",
    "description": "Motivational quote 6 — Japanese proverb (Fall seven times, rise eight)"
  },
  "block_page_quote_7": {
    "message": "生産的であることに集中せよ、忙しいことにではなく。",
    "description": "Motivational quote 7 — Tim Ferriss"
  },
  "block_page_quote_8": {
    "message": "最善の方法は、未来を予測することではなく、それを創ることだ。",
    "description": "Motivational quote 8 — Peter Drucker"
  },
  "block_page_quote_9": {
    "message": "一期一会 — この瞬間を大切に。",
    "description": "Motivational quote 9 — Japanese concept (One time, one meeting)"
  },
  "block_page_quote_10": {
    "message": "小さな進歩も、前進は前進である。",
    "description": "Motivational quote 10"
  },

  "onboarding_welcome_title": {
    "message": "Focus Mode へようこそ",
    "description": "Onboarding slide 1 title"
  },
  "onboarding_welcome_desc": {
    "message": "気が散るサイトをブロックし、生産性を高め、構造化された集中セッションで目標を達成しましょう。",
    "description": "Onboarding slide 1 description"
  },
  "onboarding_blocklist_title": {
    "message": "ブロックリストを設定",
    "description": "Onboarding slide 2 title"
  },
  "onboarding_blocklist_desc": {
    "message": "気が散るウェブサイトを追加してください。集中セッション中にブロックして、集中を助けます。",
    "description": "Onboarding slide 2 description"
  },
  "onboarding_timer_title": {
    "message": "タイマーをカスタマイズ",
    "description": "Onboarding slide 3 title"
  },
  "onboarding_timer_desc": {
    "message": "集中セッションと休憩の長さを設定します。ポモドーロテクニックを使うか、独自のリズムを作成しましょう。",
    "description": "Onboarding slide 3 description"
  },
  "onboarding_score_title": {
    "message": "Focus Score を知ろう",
    "description": "Onboarding slide 4 title"
  },
  "onboarding_score_desc": {
    "message": "Focus Score（0-100）はあなたの集中度を測定します。セッションを完了し、気が散ることを避け、連続記録を築いてスコアを向上させましょう。",
    "description": "Onboarding slide 4 description"
  },
  "onboarding_ready_title": {
    "message": "集中の準備完了",
    "description": "Onboarding slide 5 title"
  },
  "onboarding_ready_desc": {
    "message": "設定が完了しました。最初の集中セッションを開始して、今すぐ生産性を高めましょう。",
    "description": "Onboarding slide 5 description"
  },
  "onboarding_btn_next": {
    "message": "次へ",
    "description": "Next button in onboarding"
  },
  "onboarding_btn_skip": {
    "message": "スキップ",
    "description": "Skip button in onboarding"
  },
  "onboarding_btn_back": {
    "message": "戻る",
    "description": "Back button in onboarding"
  },
  "onboarding_btn_get_started": {
    "message": "始める",
    "description": "Get started button"
  },
  "onboarding_btn_add_sites": {
    "message": "サイトを追加",
    "description": "Add sites button in onboarding"
  },
  "onboarding_progress": {
    "message": "$CURRENT$ / $TOTAL$",
    "description": "Onboarding progress indicator",
    "placeholders": {
      "current": { "content": "$1", "example": "2" },
      "total": { "content": "$2", "example": "5" }
    }
  },

  "notification_focus_started": {
    "message": "集中セッション開始。$MINS$分間集中しましょう。",
    "description": "Focus session started notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "25" }
    }
  },
  "notification_focus_complete": {
    "message": "集中セッション完了。お疲れさまでした。",
    "description": "Focus session complete notification"
  },
  "notification_break_started": {
    "message": "休憩時間です。$MINS$分間リラックスしましょう。",
    "description": "Break started notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "5" }
    }
  },
  "notification_break_over": {
    "message": "休憩終了。次のセッションの準備はいいですか？",
    "description": "Break over notification"
  },
  "notification_nuclear_started": {
    "message": "Nuclear Mode が$MINS$分間有効になりました。すべてのサイトがブロックされています。",
    "description": "Nuclear Mode started notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "60" }
    }
  },
  "notification_nuclear_ended": {
    "message": "Nuclear Mode が終了しました。サイトのブロックが解除されました。",
    "description": "Nuclear Mode ended notification"
  },
  "notification_streak_milestone": {
    "message": "$DAYS$日間の連続記録達成。この調子で頑張りましょう。",
    "description": "Streak milestone notification",
    "placeholders": {
      "days": { "content": "$1", "example": "7" }
    }
  },
  "notification_score_improved": {
    "message": "Focus Score が $SCORE$ に上がりました。",
    "description": "Focus Score improvement notification",
    "placeholders": {
      "score": { "content": "$1", "example": "90" }
    }
  },
  "notification_daily_goal": {
    "message": "日課達成。今日は$COUNT$セッションを完了しました。",
    "description": "Daily goal completed notification",
    "placeholders": {
      "count": { "content": "$1", "example": "4" }
    }
  },

  "error_invalid_url": {
    "message": "無効なURLです。正しいドメインを入力してください。",
    "description": "Invalid URL error"
  },
  "error_duplicate_site": {
    "message": "このサイトは既にブロックリストに登録されています。",
    "description": "Duplicate site error"
  },
  "error_storage_full": {
    "message": "ストレージがいっぱいです。データを削除して空きを作ってください。",
    "description": "Storage full error"
  },
  "error_network": {
    "message": "接続エラーです。インターネット接続を確認してください。",
    "description": "Network error"
  },
  "error_generic": {
    "message": "問題が発生しました。もう一度お試しください。",
    "description": "Generic error message"
  },
  "error_permission_denied": {
    "message": "権限が拒否されました。拡張機能の権限を確認してください。",
    "description": "Permission denied error"
  },
  "error_session_conflict": {
    "message": "既にセッションが実行中です。",
    "description": "Session conflict error"
  },
  "error_nuclear_active": {
    "message": "Nuclear Mode が有効な間は設定を変更できません。",
    "description": "Cannot modify during Nuclear Mode"
  },
  "error_import_invalid": {
    "message": "無効なインポートファイルです。",
    "description": "Invalid import file error"
  },
  "error_export_failed": {
    "message": "データのエクスポートに失敗しました。",
    "description": "Export failed error"
  },

  "paywall_title": {
    "message": "Focus Mode Pro を解放",
    "description": "Paywall title (T1)"
  },
  "paywall_subtitle": {
    "message": "生産性を次のレベルへ",
    "description": "Paywall subtitle (T2)"
  },
  "paywall_feature_1": {
    "message": "ブロックサイト数無制限",
    "description": "Pro feature 1 (T3)"
  },
  "paywall_feature_2": {
    "message": "詳細な統計とグラフ",
    "description": "Pro feature 2 (T4)"
  },
  "paywall_feature_3": {
    "message": "高度な Nuclear Mode",
    "description": "Pro feature 3 (T5)"
  },
  "paywall_feature_4": {
    "message": "プレミアム環境音",
    "description": "Pro feature 4 (T6)"
  },
  "paywall_feature_5": {
    "message": "デバイス間同期",
    "description": "Pro feature 5 (T7)"
  },
  "paywall_feature_6": {
    "message": "カスタムブロックスケジュール",
    "description": "Pro feature 6 (T8)"
  },
  "paywall_price_monthly": {
    "message": "$PRICE$/月",
    "description": "Monthly price display (T9)",
    "placeholders": {
      "price": { "content": "$1", "example": "¥750" }
    }
  },
  "paywall_price_lifetime": {
    "message": "$PRICE$ 買い切り",
    "description": "Lifetime price display (T10)",
    "placeholders": {
      "price": { "content": "$1", "example": "¥7,500" }
    }
  },
  "paywall_btn_subscribe": {
    "message": "Pro に登録",
    "description": "Subscribe button"
  },
  "paywall_btn_lifetime": {
    "message": "永久版を購入",
    "description": "Lifetime purchase button"
  },
  "paywall_btn_restore": {
    "message": "購入を復元",
    "description": "Restore purchase button"
  },
  "paywall_guarantee": {
    "message": "30日間返金保証",
    "description": "Money-back guarantee"
  },
  "paywall_trial": {
    "message": "7日間無料トライアル",
    "description": "Free trial text"
  },
  "paywall_cancel_anytime": {
    "message": "いつでもキャンセル可能",
    "description": "Cancel anytime text"
  },

  "achievement_first_session": {
    "message": "最初のセッション完了",
    "description": "First session achievement"
  },
  "achievement_ten_sessions": {
    "message": "10セッション完了",
    "description": "10 sessions achievement"
  },
  "achievement_hundred_sessions": {
    "message": "100セッション完了",
    "description": "100 sessions achievement"
  },
  "achievement_first_streak": {
    "message": "初の3日連続記録",
    "description": "First 3-day streak"
  },
  "achievement_week_streak": {
    "message": "7日連続記録",
    "description": "7-day streak achievement"
  },
  "achievement_month_streak": {
    "message": "30日連続記録",
    "description": "30-day streak achievement"
  },
  "achievement_focus_master": {
    "message": "Focus Score 90以上達成",
    "description": "Focus Score 90+ achievement"
  },
  "achievement_nuclear_survivor": {
    "message": "Nuclear Mode を生き延びた",
    "description": "Completed Nuclear Mode session"
  },
  "achievement_early_bird": {
    "message": "早起き — 朝7時前のセッション",
    "description": "Early bird achievement"
  },
  "achievement_night_owl": {
    "message": "夜型 — 夜11時以降のセッション",
    "description": "Night owl achievement"
  },
  "achievement_unlocked": {
    "message": "実績解除: $NAME$",
    "description": "Achievement unlocked notification",
    "placeholders": {
      "name": { "content": "$1", "example": "最初のセッション" }
    }
  },

  "streak_lost": {
    "message": "連続記録が途切れました。今日から新しい記録を始めましょう。",
    "description": "Streak lost message"
  },
  "streak_at_risk": {
    "message": "$DAYS$日間の連続記録が途切れそうです。今日中にセッションを完了しましょう。",
    "description": "Streak at risk warning",
    "placeholders": {
      "days": { "content": "$1", "example": "5" }
    }
  },
  "streak_protected": {
    "message": "連続記録保護（Pro）",
    "description": "Streak protection Pro feature"
  },
  "streak_frozen": {
    "message": "連続記録を今日は凍結中",
    "description": "Streak freeze active"
  },
  "streak_new_record": {
    "message": "連続記録の新記録: $DAYS$日間",
    "description": "New streak record",
    "placeholders": {
      "days": { "content": "$1", "example": "14" }
    }
  },

  "common_save": {
    "message": "保存",
    "description": "Save button"
  },
  "common_cancel": {
    "message": "キャンセル",
    "description": "Cancel button"
  },
  "common_confirm": {
    "message": "確認",
    "description": "Confirm button"
  },
  "common_delete": {
    "message": "削除",
    "description": "Delete button"
  },
  "common_edit": {
    "message": "編集",
    "description": "Edit button"
  },
  "common_close": {
    "message": "閉じる",
    "description": "Close button"
  },
  "common_done": {
    "message": "完了",
    "description": "Done button"
  },
  "common_loading": {
    "message": "読み込み中...",
    "description": "Loading state"
  },
  "common_enabled": {
    "message": "有効",
    "description": "Enabled state"
  },
  "common_disabled": {
    "message": "無効",
    "description": "Disabled state"
  },
  "common_on": {
    "message": "オン",
    "description": "On toggle state"
  },
  "common_off": {
    "message": "オフ",
    "description": "Off toggle state"
  },
  "common_yes": {
    "message": "はい",
    "description": "Yes"
  },
  "common_no": {
    "message": "いいえ",
    "description": "No"
  },
  "common_ok": {
    "message": "OK",
    "description": "OK button"
  },
  "common_reset": {
    "message": "リセット",
    "description": "Reset button"
  },
  "common_retry": {
    "message": "再試行",
    "description": "Retry button"
  },
  "common_learn_more": {
    "message": "詳しく見る",
    "description": "Learn more link"
  },
  "common_pro_badge": {
    "message": "Pro",
    "description": "Pro badge label — brand term"
  },
  "common_free_badge": {
    "message": "無料",
    "description": "Free badge label"
  },
  "common_new_badge": {
    "message": "新規",
    "description": "New badge label"
  },
  "common_hours": {
    "message": "$COUNT$時間",
    "description": "Hours",
    "placeholders": {
      "count": { "content": "$1", "example": "2" }
    }
  },
  "common_minutes": {
    "message": "$COUNT$分",
    "description": "Minutes",
    "placeholders": {
      "count": { "content": "$1", "example": "30" }
    }
  },
  "common_seconds": {
    "message": "$COUNT$秒",
    "description": "Seconds",
    "placeholders": {
      "count": { "content": "$1", "example": "45" }
    }
  },
  "common_days": {
    "message": "$COUNT$日",
    "description": "Days with count",
    "placeholders": {
      "count": { "content": "$1", "example": "7" }
    }
  },
  "common_today": {
    "message": "今日",
    "description": "Today"
  },
  "common_yesterday": {
    "message": "昨日",
    "description": "Yesterday"
  },
  "common_this_week": {
    "message": "今週",
    "description": "This week"
  },
  "common_all_time": {
    "message": "全期間",
    "description": "All time"
  }
}
```

**Japanese translation notes:**
- Total entries: 210+
- Polite (desu/masu) form used throughout for a respectful but approachable tone
- Katakana used for established loanwords: タイマー, ブロック, セッション, サウンド, ダッシュボード, スキップ
- Native Japanese used for concepts with natural Japanese equivalents: 集中 (focus), 休憩 (break), 統計 (statistics), 設定 (settings)
- Japanese-specific motivational quotes: includes classic Japanese proverbs (七転び八起き, 千里の道も一歩から, 継続は力なり, 一期一会)
- CJK text is inherently more concise (no spaces between words), which helps with UI constraints
- Counter words used correctly: 回 (sessions), 日間 (consecutive days), 分 (minutes)

---

## 4. French (fr) — Complete messages.json

**Locale:** `_locales/fr/messages.json`
**Target markets:** France, Belgium, Switzerland, Canada (Quebec), Africa (Francophone)
**Register:** Formal-friendly (vous-form, professional but warm)

```json
{
  "_locale_metadata": {
    "message": "fr",
    "description": "French locale metadata"
  },

  "extension_name": {
    "message": "Focus Mode - Blocker",
    "description": "Extension name — brand term, do not translate"
  },
  "extension_description": {
    "message": "Bloquez les sites distrayants, minuteur Pomodoro, Focus Score et Nuclear Mode. Restez concentre et productif.",
    "description": "Chrome Web Store extension description"
  },
  "extension_short_description": {
    "message": "Bloquez les distractions. Restez concentre.",
    "description": "Short tagline for the extension"
  },

  "popup_title": {
    "message": "Focus Mode",
    "description": "Popup header title — brand term"
  },
  "popup_state_idle": {
    "message": "Pret a se concentrer",
    "description": "Popup state when no session is active"
  },
  "popup_state_focus": {
    "message": "Session de concentration active",
    "description": "Popup state during focus session"
  },
  "popup_state_break": {
    "message": "Temps de pause",
    "description": "Popup state during break"
  },
  "popup_state_long_break": {
    "message": "Longue pause",
    "description": "Popup state during long break"
  },
  "popup_state_nuclear": {
    "message": "Nuclear Mode actif",
    "description": "Popup state when Nuclear Mode is engaged"
  },
  "popup_state_paused": {
    "message": "Session en pause",
    "description": "Popup state when session is paused"
  },

  "popup_btn_start_focus": {
    "message": "Demarrer la concentration",
    "description": "Button to start a focus session"
  },
  "popup_btn_stop": {
    "message": "Arreter",
    "description": "Button to stop current session"
  },
  "popup_btn_pause": {
    "message": "Pause",
    "description": "Button to pause current session"
  },
  "popup_btn_resume": {
    "message": "Reprendre",
    "description": "Button to resume paused session"
  },
  "popup_btn_skip_break": {
    "message": "Passer la pause",
    "description": "Button to skip break and start next focus"
  },
  "popup_btn_start_break": {
    "message": "Demarrer la pause",
    "description": "Button to start a break"
  },
  "popup_btn_nuclear": {
    "message": "Activer Nuclear Mode",
    "description": "Button to activate Nuclear Mode"
  },
  "popup_btn_settings": {
    "message": "Parametres",
    "description": "Button to open settings/options page"
  },
  "popup_btn_upgrade": {
    "message": "Passer a Pro",
    "description": "Button to upgrade to Pro"
  },

  "popup_timer_minutes": {
    "message": "$MINS$ min",
    "description": "Timer display in minutes",
    "placeholders": {
      "mins": { "content": "$1", "example": "25" }
    }
  },
  "popup_timer_seconds": {
    "message": "$MINS$:$SECS$",
    "description": "Timer display mm:ss",
    "placeholders": {
      "mins": { "content": "$1", "example": "24" },
      "secs": { "content": "$2", "example": "59" }
    }
  },
  "popup_sessions_today": {
    "message": "$COUNT$ sessions aujourd'hui",
    "description": "Number of focus sessions completed today",
    "placeholders": {
      "count": { "content": "$1", "example": "4" }
    }
  },
  "popup_focus_score_label": {
    "message": "Focus Score",
    "description": "Label for Focus Score display — brand term"
  },
  "popup_focus_score_value": {
    "message": "$SCORE$/100",
    "description": "Focus Score numeric display",
    "placeholders": {
      "score": { "content": "$1", "example": "85" }
    }
  },
  "popup_streak_label": {
    "message": "Serie",
    "description": "Label for streak counter"
  },
  "popup_streak_days": {
    "message": "$COUNT$ jours",
    "description": "Streak day count",
    "placeholders": {
      "count": { "content": "$1", "example": "7" }
    }
  },
  "popup_quick_block": {
    "message": "Blocage rapide",
    "description": "Quick block site button"
  },
  "popup_blocked_count": {
    "message": "$COUNT$ sites bloques",
    "description": "Number of blocked sites",
    "placeholders": {
      "count": { "content": "$1", "example": "12" }
    }
  },
  "popup_focus_time_today": {
    "message": "$TIME$ de concentration aujourd'hui",
    "description": "Total focus time today",
    "placeholders": {
      "time": { "content": "$1", "example": "2h 15m" }
    }
  },

  "options_title": {
    "message": "Parametres de Focus Mode",
    "description": "Options page title"
  },
  "options_nav_general": {
    "message": "General",
    "description": "Options navigation — general section"
  },
  "options_nav_timer": {
    "message": "Minuteur",
    "description": "Options navigation — timer section"
  },
  "options_nav_blocklist": {
    "message": "Liste de blocage",
    "description": "Options navigation — blocklist section"
  },
  "options_nav_nuclear": {
    "message": "Nuclear Mode",
    "description": "Options navigation — Nuclear Mode section"
  },
  "options_nav_sounds": {
    "message": "Sons",
    "description": "Options navigation — sounds section"
  },
  "options_nav_stats": {
    "message": "Statistiques",
    "description": "Options navigation — statistics section"
  },
  "options_nav_account": {
    "message": "Compte",
    "description": "Options navigation — account section"
  },
  "options_nav_about": {
    "message": "A propos",
    "description": "Options navigation — about section"
  },

  "options_general_language": {
    "message": "Langue",
    "description": "Language selector label"
  },
  "options_general_language_auto": {
    "message": "Automatique (langue du navigateur)",
    "description": "Auto-detect language option"
  },
  "options_general_theme": {
    "message": "Theme",
    "description": "Theme selector label"
  },
  "options_general_theme_light": {
    "message": "Clair",
    "description": "Light theme option"
  },
  "options_general_theme_dark": {
    "message": "Sombre",
    "description": "Dark theme option"
  },
  "options_general_theme_system": {
    "message": "Systeme",
    "description": "System theme option"
  },
  "options_general_notifications": {
    "message": "Notifications",
    "description": "Notifications toggle label"
  },
  "options_general_notifications_desc": {
    "message": "Afficher les notifications au debut et a la fin des sessions",
    "description": "Notifications toggle description"
  },
  "options_general_badge": {
    "message": "Badge de l'icone",
    "description": "Badge icon toggle label"
  },
  "options_general_badge_desc": {
    "message": "Afficher le temps restant sur l'icone de l'extension",
    "description": "Badge icon description"
  },
  "options_general_startup": {
    "message": "Demarrer avec le navigateur",
    "description": "Auto-start on browser open"
  },
  "options_general_startup_desc": {
    "message": "Demarrer automatiquement une session de concentration a l'ouverture de Chrome",
    "description": "Auto-start description"
  },

  "options_timer_focus_duration": {
    "message": "Duree de concentration",
    "description": "Focus duration setting label"
  },
  "options_timer_focus_duration_desc": {
    "message": "Duree de chaque session de concentration en minutes",
    "description": "Focus duration description"
  },
  "options_timer_break_duration": {
    "message": "Duree de pause",
    "description": "Break duration setting label"
  },
  "options_timer_break_duration_desc": {
    "message": "Duree de chaque pause courte en minutes",
    "description": "Break duration description"
  },
  "options_timer_long_break": {
    "message": "Longue pause",
    "description": "Long break duration label"
  },
  "options_timer_long_break_desc": {
    "message": "Duree de la longue pause en minutes",
    "description": "Long break duration description"
  },
  "options_timer_sessions_before_long": {
    "message": "Sessions avant la longue pause",
    "description": "Sessions before long break"
  },
  "options_timer_auto_start_break": {
    "message": "Demarrer la pause automatiquement",
    "description": "Auto-start break toggle"
  },
  "options_timer_auto_start_focus": {
    "message": "Demarrer la concentration automatiquement",
    "description": "Auto-start next focus toggle"
  },
  "options_timer_minutes_label": {
    "message": "minutes",
    "description": "Minutes unit label"
  },

  "options_blocklist_title": {
    "message": "Sites bloques",
    "description": "Blocklist section title"
  },
  "options_blocklist_add": {
    "message": "Ajouter un site",
    "description": "Add site button"
  },
  "options_blocklist_add_placeholder": {
    "message": "Entrez un domaine (ex. facebook.com)",
    "description": "Add site input placeholder"
  },
  "options_blocklist_remove": {
    "message": "Supprimer",
    "description": "Remove site button"
  },
  "options_blocklist_empty": {
    "message": "Aucun site bloque. Ajoutez des sites a bloquer pendant les sessions de concentration.",
    "description": "Empty blocklist message"
  },
  "options_blocklist_import": {
    "message": "Importer la liste",
    "description": "Import blocklist button"
  },
  "options_blocklist_export": {
    "message": "Exporter la liste",
    "description": "Export blocklist button"
  },
  "options_blocklist_preset": {
    "message": "Listes predefinies",
    "description": "Preset blocklist button"
  },
  "options_blocklist_preset_social": {
    "message": "Reseaux sociaux",
    "description": "Social media preset"
  },
  "options_blocklist_preset_news": {
    "message": "Actualites",
    "description": "News sites preset"
  },
  "options_blocklist_preset_entertainment": {
    "message": "Divertissement",
    "description": "Entertainment preset"
  },
  "options_blocklist_preset_shopping": {
    "message": "Shopping",
    "description": "Shopping sites preset"
  },
  "options_blocklist_always_block": {
    "message": "Toujours bloquer",
    "description": "Always block toggle"
  },
  "options_blocklist_schedule": {
    "message": "Blocage programme",
    "description": "Schedule-based blocking"
  },

  "options_nuclear_title": {
    "message": "Parametres Nuclear Mode",
    "description": "Nuclear Mode settings title"
  },
  "options_nuclear_desc": {
    "message": "Nuclear Mode bloque tous les sites de votre liste sans possibilite de desactivation avant la fin du temps.",
    "description": "Nuclear Mode description"
  },
  "options_nuclear_duration": {
    "message": "Duree du Nuclear Mode",
    "description": "Nuclear Mode duration label"
  },
  "options_nuclear_block_all": {
    "message": "Bloquer tous les sites (pas seulement la liste)",
    "description": "Block all sites option"
  },
  "options_nuclear_allowlist": {
    "message": "Sites autorises en Nuclear Mode",
    "description": "Nuclear Mode allowlist"
  },
  "options_nuclear_allowlist_add": {
    "message": "Ajouter un site autorise",
    "description": "Add to Nuclear Mode allowlist"
  },
  "options_nuclear_warning": {
    "message": "Nuclear Mode ne peut pas etre desactive une fois lance. Utilisez-le avec precaution.",
    "description": "Nuclear Mode warning"
  },
  "options_nuclear_confirm": {
    "message": "Confirmer l'activation",
    "description": "Confirm Nuclear Mode activation"
  },

  "options_sounds_title": {
    "message": "Sons d'ambiance",
    "description": "Ambient sounds section title"
  },
  "options_sounds_enable": {
    "message": "Activer les sons pendant la concentration",
    "description": "Enable sounds toggle"
  },
  "options_sounds_volume": {
    "message": "Volume",
    "description": "Volume slider label"
  },
  "options_sounds_rain": {
    "message": "Pluie",
    "description": "Rain ambient sound"
  },
  "options_sounds_forest": {
    "message": "Foret",
    "description": "Forest ambient sound"
  },
  "options_sounds_cafe": {
    "message": "Cafe",
    "description": "Cafe ambient sound"
  },
  "options_sounds_ocean": {
    "message": "Ocean",
    "description": "Ocean ambient sound"
  },
  "options_sounds_white_noise": {
    "message": "Bruit blanc",
    "description": "White noise"
  },
  "options_sounds_fireplace": {
    "message": "Cheminee",
    "description": "Fireplace ambient sound"
  },
  "options_sounds_notification": {
    "message": "Son de notification",
    "description": "Notification sound selector"
  },
  "options_sounds_notification_chime": {
    "message": "Carillon",
    "description": "Chime notification sound"
  },
  "options_sounds_notification_bell": {
    "message": "Cloche",
    "description": "Bell notification sound"
  },
  "options_sounds_notification_none": {
    "message": "Aucun son",
    "description": "No notification sound"
  },

  "options_stats_title": {
    "message": "Statistiques",
    "description": "Statistics section title"
  },
  "options_stats_today": {
    "message": "Aujourd'hui",
    "description": "Today tab"
  },
  "options_stats_week": {
    "message": "Cette semaine",
    "description": "This week tab"
  },
  "options_stats_month": {
    "message": "Ce mois",
    "description": "This month tab"
  },
  "options_stats_all_time": {
    "message": "Depuis le debut",
    "description": "All time tab"
  },
  "options_stats_focus_time": {
    "message": "Temps de concentration",
    "description": "Focus time stat label"
  },
  "options_stats_sessions": {
    "message": "Sessions completees",
    "description": "Completed sessions stat"
  },
  "options_stats_blocked": {
    "message": "Sites bloques",
    "description": "Sites blocked stat"
  },
  "options_stats_streak": {
    "message": "Meilleure serie",
    "description": "Best streak stat"
  },
  "options_stats_avg_score": {
    "message": "Focus Score moyen",
    "description": "Average Focus Score"
  },
  "options_stats_export": {
    "message": "Exporter les donnees",
    "description": "Export statistics data"
  },
  "options_stats_reset": {
    "message": "Reinitialiser les statistiques",
    "description": "Reset statistics button"
  },
  "options_stats_reset_confirm": {
    "message": "Toutes les statistiques seront definitivement supprimees. Cette action est irreversible.",
    "description": "Reset confirmation message"
  },

  "options_account_title": {
    "message": "Compte",
    "description": "Account section title"
  },
  "options_account_plan_free": {
    "message": "Plan gratuit",
    "description": "Free plan label"
  },
  "options_account_plan_pro": {
    "message": "Focus Mode Pro",
    "description": "Pro plan label"
  },
  "options_account_upgrade": {
    "message": "Passer a Pro",
    "description": "Upgrade button"
  },
  "options_account_manage": {
    "message": "Gerer l'abonnement",
    "description": "Manage subscription link"
  },
  "options_account_restore": {
    "message": "Restaurer l'achat",
    "description": "Restore purchase button"
  },
  "options_account_data_sync": {
    "message": "Synchronisation des donnees",
    "description": "Data sync toggle"
  },
  "options_account_data_sync_desc": {
    "message": "Synchroniser les parametres entre les appareils (Pro requis)",
    "description": "Data sync description"
  },

  "options_about_title": {
    "message": "A propos de Focus Mode",
    "description": "About section title"
  },
  "options_about_version": {
    "message": "Version $VERSION$",
    "description": "Version display",
    "placeholders": {
      "version": { "content": "$1", "example": "1.0.0" }
    }
  },
  "options_about_developer": {
    "message": "Developpe par Zovo",
    "description": "Developer credit"
  },
  "options_about_rate": {
    "message": "Evaluer sur le Chrome Web Store",
    "description": "Rate extension link"
  },
  "options_about_feedback": {
    "message": "Envoyer vos commentaires",
    "description": "Feedback link"
  },
  "options_about_privacy": {
    "message": "Politique de confidentialite",
    "description": "Privacy policy link"
  },
  "options_about_terms": {
    "message": "Conditions d'utilisation",
    "description": "Terms of service link"
  },
  "options_about_changelog": {
    "message": "Journal des modifications",
    "description": "Changelog link"
  },
  "options_about_support": {
    "message": "Centre d'aide",
    "description": "Support/help center link"
  },

  "block_page_title": {
    "message": "Site bloque",
    "description": "Block page title"
  },
  "block_page_heading": {
    "message": "Ce site est bloque",
    "description": "Block page main heading"
  },
  "block_page_description": {
    "message": "$SITE$ est bloque pendant votre session de concentration. Restez concentre sur l'essentiel.",
    "description": "Block page description",
    "placeholders": {
      "site": { "content": "$1", "example": "facebook.com" }
    }
  },
  "block_page_time_remaining": {
    "message": "Temps restant : $TIME$",
    "description": "Time remaining on block page",
    "placeholders": {
      "time": { "content": "$1", "example": "18:32" }
    }
  },
  "block_page_nuclear_active": {
    "message": "Nuclear Mode est actif. Ce site ne peut pas etre debloque.",
    "description": "Nuclear Mode active message"
  },
  "block_page_btn_go_back": {
    "message": "Retour",
    "description": "Go back button on block page"
  },
  "block_page_btn_dashboard": {
    "message": "Aller au tableau de bord",
    "description": "Go to dashboard button"
  },
  "block_page_focus_score": {
    "message": "Votre Focus Score : $SCORE$",
    "description": "Focus Score display on block page",
    "placeholders": {
      "score": { "content": "$1", "example": "85" }
    }
  },
  "block_page_sessions_today": {
    "message": "Sessions aujourd'hui : $COUNT$",
    "description": "Sessions today on block page",
    "placeholders": {
      "count": { "content": "$1", "example": "3" }
    }
  },
  "block_page_streak": {
    "message": "Serie actuelle : $DAYS$ jours",
    "description": "Current streak on block page",
    "placeholders": {
      "days": { "content": "$1", "example": "7" }
    }
  },

  "block_page_quote_1": {
    "message": "La discipline est le pont entre les objectifs et les realisations.",
    "description": "Motivational quote 1 — Jim Rohn"
  },
  "block_page_quote_2": {
    "message": "Le succes est la somme de petits efforts repetes jour apres jour.",
    "description": "Motivational quote 2 — Robert Collier"
  },
  "block_page_quote_3": {
    "message": "Concentrez-vous sur etre productif, pas sur etre occupe.",
    "description": "Motivational quote 3 — Tim Ferriss"
  },
  "block_page_quote_4": {
    "message": "La concentration est la racine de toutes les capacites humaines.",
    "description": "Motivational quote 4 — Bruce Lee"
  },
  "block_page_quote_5": {
    "message": "Ce n'est pas que nous ayons peu de temps, c'est que nous en perdons beaucoup.",
    "description": "Motivational quote 5 — Seneque"
  },
  "block_page_quote_6": {
    "message": "L'avenir appartient a ceux qui se levent tot.",
    "description": "Motivational quote 6 — French proverb"
  },
  "block_page_quote_7": {
    "message": "La ou il y a de la concentration, il y a de la puissance.",
    "description": "Motivational quote 7 — Tony Robbins"
  },
  "block_page_quote_8": {
    "message": "La meilleure facon de predire l'avenir, c'est de le creer.",
    "description": "Motivational quote 8 — Peter Drucker"
  },
  "block_page_quote_9": {
    "message": "Chaque moment est une nouvelle occasion de changer votre vie.",
    "description": "Motivational quote 9"
  },
  "block_page_quote_10": {
    "message": "Petit a petit, l'oiseau fait son nid.",
    "description": "Motivational quote 10 — French proverb (Little by little, the bird builds its nest)"
  },

  "onboarding_welcome_title": {
    "message": "Bienvenue dans Focus Mode",
    "description": "Onboarding slide 1 title"
  },
  "onboarding_welcome_desc": {
    "message": "Bloquez les distractions, augmentez votre productivite et atteignez vos objectifs avec des sessions de concentration structurees.",
    "description": "Onboarding slide 1 description"
  },
  "onboarding_blocklist_title": {
    "message": "Configurez votre liste de blocage",
    "description": "Onboarding slide 2 title"
  },
  "onboarding_blocklist_desc": {
    "message": "Ajoutez les sites web qui vous distraient. Nous les bloquerons pendant vos sessions de concentration pour vous aider a rester concentre.",
    "description": "Onboarding slide 2 description"
  },
  "onboarding_timer_title": {
    "message": "Personnalisez votre minuteur",
    "description": "Onboarding slide 3 title"
  },
  "onboarding_timer_desc": {
    "message": "Definissez la duree de vos sessions de concentration et de vos pauses. Utilisez la technique Pomodoro ou creez votre propre rythme.",
    "description": "Onboarding slide 3 description"
  },
  "onboarding_score_title": {
    "message": "Decouvrez votre Focus Score",
    "description": "Onboarding slide 4 title"
  },
  "onboarding_score_desc": {
    "message": "Votre Focus Score (0-100) mesure votre niveau de concentration. Completez des sessions, evitez les distractions et construisez des series pour ameliorer votre score.",
    "description": "Onboarding slide 4 description"
  },
  "onboarding_ready_title": {
    "message": "Pret a se concentrer",
    "description": "Onboarding slide 5 title"
  },
  "onboarding_ready_desc": {
    "message": "Tout est configure. Lancez votre premiere session de concentration et devenez plus productif des maintenant.",
    "description": "Onboarding slide 5 description"
  },
  "onboarding_btn_next": {
    "message": "Suivant",
    "description": "Next button in onboarding"
  },
  "onboarding_btn_skip": {
    "message": "Passer",
    "description": "Skip button in onboarding"
  },
  "onboarding_btn_back": {
    "message": "Retour",
    "description": "Back button in onboarding"
  },
  "onboarding_btn_get_started": {
    "message": "Commencer",
    "description": "Get started button"
  },
  "onboarding_btn_add_sites": {
    "message": "Ajouter des sites",
    "description": "Add sites button in onboarding"
  },
  "onboarding_progress": {
    "message": "$CURRENT$ sur $TOTAL$",
    "description": "Onboarding progress indicator",
    "placeholders": {
      "current": { "content": "$1", "example": "2" },
      "total": { "content": "$2", "example": "5" }
    }
  },

  "notification_focus_started": {
    "message": "Session de concentration lancee. $MINS$ minutes de concentration.",
    "description": "Focus session started notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "25" }
    }
  },
  "notification_focus_complete": {
    "message": "Session de concentration terminee. Excellent travail !",
    "description": "Focus session complete notification"
  },
  "notification_break_started": {
    "message": "Temps de pause. Detendez-vous pendant $MINS$ minutes.",
    "description": "Break started notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "5" }
    }
  },
  "notification_break_over": {
    "message": "Pause terminee. Pret pour la prochaine session.",
    "description": "Break over notification"
  },
  "notification_nuclear_started": {
    "message": "Nuclear Mode active pour $MINS$ minutes. Tous les sites sont bloques.",
    "description": "Nuclear Mode started notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "60" }
    }
  },
  "notification_nuclear_ended": {
    "message": "Nuclear Mode termine. Les sites ont ete debloques.",
    "description": "Nuclear Mode ended notification"
  },
  "notification_streak_milestone": {
    "message": "Serie de $DAYS$ jours. Continuez comme ca !",
    "description": "Streak milestone notification",
    "placeholders": {
      "days": { "content": "$1", "example": "7" }
    }
  },
  "notification_score_improved": {
    "message": "Votre Focus Score est monte a $SCORE$.",
    "description": "Focus Score improvement notification",
    "placeholders": {
      "score": { "content": "$1", "example": "90" }
    }
  },
  "notification_daily_goal": {
    "message": "Objectif quotidien atteint. Vous avez complete $COUNT$ sessions aujourd'hui.",
    "description": "Daily goal completed notification",
    "placeholders": {
      "count": { "content": "$1", "example": "4" }
    }
  },

  "error_invalid_url": {
    "message": "URL invalide. Veuillez entrer un domaine correct.",
    "description": "Invalid URL error"
  },
  "error_duplicate_site": {
    "message": "Ce site est deja dans la liste de blocage.",
    "description": "Duplicate site error"
  },
  "error_storage_full": {
    "message": "Stockage plein. Supprimez des donnees pour continuer.",
    "description": "Storage full error"
  },
  "error_network": {
    "message": "Erreur de connexion. Verifiez votre connexion Internet.",
    "description": "Network error"
  },
  "error_generic": {
    "message": "Une erreur est survenue. Veuillez reessayer.",
    "description": "Generic error message"
  },
  "error_permission_denied": {
    "message": "Permission refusee. Verifiez les autorisations de l'extension.",
    "description": "Permission denied error"
  },
  "error_session_conflict": {
    "message": "Une session est deja en cours.",
    "description": "Session conflict error"
  },
  "error_nuclear_active": {
    "message": "Les parametres ne peuvent pas etre modifies pendant que Nuclear Mode est actif.",
    "description": "Cannot modify during Nuclear Mode"
  },
  "error_import_invalid": {
    "message": "Fichier d'importation invalide.",
    "description": "Invalid import file error"
  },
  "error_export_failed": {
    "message": "Echec de l'exportation des donnees.",
    "description": "Export failed error"
  },

  "paywall_title": {
    "message": "Debloquez Focus Mode Pro",
    "description": "Paywall title (T1)"
  },
  "paywall_subtitle": {
    "message": "Passez votre productivite au niveau superieur",
    "description": "Paywall subtitle (T2)"
  },
  "paywall_feature_1": {
    "message": "Sites bloques illimites",
    "description": "Pro feature 1 (T3)"
  },
  "paywall_feature_2": {
    "message": "Statistiques detaillees et graphiques",
    "description": "Pro feature 2 (T4)"
  },
  "paywall_feature_3": {
    "message": "Nuclear Mode avance",
    "description": "Pro feature 3 (T5)"
  },
  "paywall_feature_4": {
    "message": "Sons d'ambiance premium",
    "description": "Pro feature 4 (T6)"
  },
  "paywall_feature_5": {
    "message": "Synchronisation multi-appareils",
    "description": "Pro feature 5 (T7)"
  },
  "paywall_feature_6": {
    "message": "Blocage programme personnalise",
    "description": "Pro feature 6 (T8)"
  },
  "paywall_price_monthly": {
    "message": "$PRICE$/mois",
    "description": "Monthly price display (T9)",
    "placeholders": {
      "price": { "content": "$1", "example": "4,99 €" }
    }
  },
  "paywall_price_lifetime": {
    "message": "$PRICE$ paiement unique",
    "description": "Lifetime price display (T10)",
    "placeholders": {
      "price": { "content": "$1", "example": "49,99 €" }
    }
  },
  "paywall_btn_subscribe": {
    "message": "S'abonner a Pro",
    "description": "Subscribe button"
  },
  "paywall_btn_lifetime": {
    "message": "Acheter a vie",
    "description": "Lifetime purchase button"
  },
  "paywall_btn_restore": {
    "message": "Restaurer l'achat",
    "description": "Restore purchase button"
  },
  "paywall_guarantee": {
    "message": "Garantie de remboursement de 30 jours",
    "description": "Money-back guarantee"
  },
  "paywall_trial": {
    "message": "Essai gratuit de 7 jours",
    "description": "Free trial text"
  },
  "paywall_cancel_anytime": {
    "message": "Annulation a tout moment",
    "description": "Cancel anytime text"
  },

  "achievement_first_session": {
    "message": "Premiere session terminee",
    "description": "First session achievement"
  },
  "achievement_ten_sessions": {
    "message": "10 sessions terminees",
    "description": "10 sessions achievement"
  },
  "achievement_hundred_sessions": {
    "message": "100 sessions terminees",
    "description": "100 sessions achievement"
  },
  "achievement_first_streak": {
    "message": "Premiere serie de 3 jours",
    "description": "First 3-day streak"
  },
  "achievement_week_streak": {
    "message": "Serie de 7 jours",
    "description": "7-day streak achievement"
  },
  "achievement_month_streak": {
    "message": "Serie de 30 jours",
    "description": "30-day streak achievement"
  },
  "achievement_focus_master": {
    "message": "Focus Score de 90+",
    "description": "Focus Score 90+ achievement"
  },
  "achievement_nuclear_survivor": {
    "message": "Survivant du Nuclear Mode",
    "description": "Completed Nuclear Mode session"
  },
  "achievement_early_bird": {
    "message": "Leve-tot — session avant 7h",
    "description": "Early bird achievement"
  },
  "achievement_night_owl": {
    "message": "Couche-tard — session apres 23h",
    "description": "Night owl achievement"
  },
  "achievement_unlocked": {
    "message": "Succes debloque : $NAME$",
    "description": "Achievement unlocked notification",
    "placeholders": {
      "name": { "content": "$1", "example": "Premiere session" }
    }
  },

  "streak_lost": {
    "message": "Serie perdue. Commencez-en une nouvelle aujourd'hui.",
    "description": "Streak lost message"
  },
  "streak_at_risk": {
    "message": "Votre serie de $DAYS$ jours est menacee. Completez une session aujourd'hui.",
    "description": "Streak at risk warning",
    "placeholders": {
      "days": { "content": "$1", "example": "5" }
    }
  },
  "streak_protected": {
    "message": "Serie protegee (Pro)",
    "description": "Streak protection Pro feature"
  },
  "streak_frozen": {
    "message": "Serie gelee pour aujourd'hui",
    "description": "Streak freeze active"
  },
  "streak_new_record": {
    "message": "Nouveau record de serie : $DAYS$ jours",
    "description": "New streak record",
    "placeholders": {
      "days": { "content": "$1", "example": "14" }
    }
  },

  "common_save": {
    "message": "Enregistrer",
    "description": "Save button"
  },
  "common_cancel": {
    "message": "Annuler",
    "description": "Cancel button"
  },
  "common_confirm": {
    "message": "Confirmer",
    "description": "Confirm button"
  },
  "common_delete": {
    "message": "Supprimer",
    "description": "Delete button"
  },
  "common_edit": {
    "message": "Modifier",
    "description": "Edit button"
  },
  "common_close": {
    "message": "Fermer",
    "description": "Close button"
  },
  "common_done": {
    "message": "Termine",
    "description": "Done button"
  },
  "common_loading": {
    "message": "Chargement...",
    "description": "Loading state"
  },
  "common_enabled": {
    "message": "Active",
    "description": "Enabled state"
  },
  "common_disabled": {
    "message": "Desactive",
    "description": "Disabled state"
  },
  "common_on": {
    "message": "Active",
    "description": "On toggle state"
  },
  "common_off": {
    "message": "Desactive",
    "description": "Off toggle state"
  },
  "common_yes": {
    "message": "Oui",
    "description": "Yes"
  },
  "common_no": {
    "message": "Non",
    "description": "No"
  },
  "common_ok": {
    "message": "OK",
    "description": "OK button"
  },
  "common_reset": {
    "message": "Reinitialiser",
    "description": "Reset button"
  },
  "common_retry": {
    "message": "Reessayer",
    "description": "Retry button"
  },
  "common_learn_more": {
    "message": "En savoir plus",
    "description": "Learn more link"
  },
  "common_pro_badge": {
    "message": "Pro",
    "description": "Pro badge label — brand term"
  },
  "common_free_badge": {
    "message": "Gratuit",
    "description": "Free badge label"
  },
  "common_new_badge": {
    "message": "Nouveau",
    "description": "New badge label"
  },
  "common_hours": {
    "message": "$COUNT$h",
    "description": "Hours abbreviation",
    "placeholders": {
      "count": { "content": "$1", "example": "2" }
    }
  },
  "common_minutes": {
    "message": "$COUNT$ min",
    "description": "Minutes abbreviation",
    "placeholders": {
      "count": { "content": "$1", "example": "30" }
    }
  },
  "common_seconds": {
    "message": "$COUNT$s",
    "description": "Seconds abbreviation",
    "placeholders": {
      "count": { "content": "$1", "example": "45" }
    }
  },
  "common_days": {
    "message": "$COUNT$ jours",
    "description": "Days with count",
    "placeholders": {
      "count": { "content": "$1", "example": "7" }
    }
  },
  "common_today": {
    "message": "Aujourd'hui",
    "description": "Today"
  },
  "common_yesterday": {
    "message": "Hier",
    "description": "Yesterday"
  },
  "common_this_week": {
    "message": "Cette semaine",
    "description": "This week"
  },
  "common_all_time": {
    "message": "Depuis le debut",
    "description": "All time"
  }
}
```

**French translation notes:**
- Total entries: 210+
- Vous-form used for direct address (formal but friendly, standard for software UI in France)
- French typography: spaces before colons and exclamation marks per French typographic rules
- One French-specific proverb included (Petit a petit, l'oiseau fait son nid) alongside translated universal quotes
- "Parametres" used for Settings (standard French UI term, preferred over "Configuration")
- Text length is typically 15-20% longer than English, managed with concise phrasing

---

## 5. Portuguese-BR (pt_BR) — Complete messages.json

**Locale:** `_locales/pt_BR/messages.json`
**Target markets:** Brazil (primary), Portugal (secondary with pt_PT fallback)
**Register:** Informal-friendly (voce-form, warm and approachable — standard for Brazilian software UI)

```json
{
  "_locale_metadata": {
    "message": "pt_BR",
    "description": "Brazilian Portuguese locale metadata"
  },

  "extension_name": {
    "message": "Focus Mode - Blocker",
    "description": "Extension name — brand term, do not translate"
  },
  "extension_description": {
    "message": "Bloqueie sites que distraem, temporizador Pomodoro, Focus Score e Nuclear Mode. Mantenha o foco e a produtividade.",
    "description": "Chrome Web Store extension description"
  },
  "extension_short_description": {
    "message": "Bloqueie distracoes. Mantenha o foco.",
    "description": "Short tagline for the extension"
  },

  "popup_title": {
    "message": "Focus Mode",
    "description": "Popup header title — brand term"
  },
  "popup_state_idle": {
    "message": "Pronto para focar",
    "description": "Popup state when no session is active"
  },
  "popup_state_focus": {
    "message": "Sessao de foco ativa",
    "description": "Popup state during focus session"
  },
  "popup_state_break": {
    "message": "Hora da pausa",
    "description": "Popup state during break"
  },
  "popup_state_long_break": {
    "message": "Pausa longa",
    "description": "Popup state during long break"
  },
  "popup_state_nuclear": {
    "message": "Nuclear Mode ativo",
    "description": "Popup state when Nuclear Mode is engaged"
  },
  "popup_state_paused": {
    "message": "Sessao pausada",
    "description": "Popup state when session is paused"
  },

  "popup_btn_start_focus": {
    "message": "Iniciar foco",
    "description": "Button to start a focus session"
  },
  "popup_btn_stop": {
    "message": "Parar",
    "description": "Button to stop current session"
  },
  "popup_btn_pause": {
    "message": "Pausar",
    "description": "Button to pause current session"
  },
  "popup_btn_resume": {
    "message": "Retomar",
    "description": "Button to resume paused session"
  },
  "popup_btn_skip_break": {
    "message": "Pular pausa",
    "description": "Button to skip break and start next focus"
  },
  "popup_btn_start_break": {
    "message": "Iniciar pausa",
    "description": "Button to start a break"
  },
  "popup_btn_nuclear": {
    "message": "Ativar Nuclear Mode",
    "description": "Button to activate Nuclear Mode"
  },
  "popup_btn_settings": {
    "message": "Configuracoes",
    "description": "Button to open settings/options page"
  },
  "popup_btn_upgrade": {
    "message": "Assinar o Pro",
    "description": "Button to upgrade to Pro"
  },

  "popup_timer_minutes": {
    "message": "$MINS$ min",
    "description": "Timer display in minutes",
    "placeholders": {
      "mins": { "content": "$1", "example": "25" }
    }
  },
  "popup_timer_seconds": {
    "message": "$MINS$:$SECS$",
    "description": "Timer display mm:ss",
    "placeholders": {
      "mins": { "content": "$1", "example": "24" },
      "secs": { "content": "$2", "example": "59" }
    }
  },
  "popup_sessions_today": {
    "message": "$COUNT$ sessoes hoje",
    "description": "Number of focus sessions completed today",
    "placeholders": {
      "count": { "content": "$1", "example": "4" }
    }
  },
  "popup_focus_score_label": {
    "message": "Focus Score",
    "description": "Label for Focus Score display — brand term"
  },
  "popup_focus_score_value": {
    "message": "$SCORE$/100",
    "description": "Focus Score numeric display",
    "placeholders": {
      "score": { "content": "$1", "example": "85" }
    }
  },
  "popup_streak_label": {
    "message": "Sequencia",
    "description": "Label for streak counter"
  },
  "popup_streak_days": {
    "message": "$COUNT$ dias",
    "description": "Streak day count",
    "placeholders": {
      "count": { "content": "$1", "example": "7" }
    }
  },
  "popup_quick_block": {
    "message": "Bloqueio rapido",
    "description": "Quick block site button"
  },
  "popup_blocked_count": {
    "message": "$COUNT$ sites bloqueados",
    "description": "Number of blocked sites",
    "placeholders": {
      "count": { "content": "$1", "example": "12" }
    }
  },
  "popup_focus_time_today": {
    "message": "$TIME$ de foco hoje",
    "description": "Total focus time today",
    "placeholders": {
      "time": { "content": "$1", "example": "2h 15m" }
    }
  },

  "options_title": {
    "message": "Configuracoes do Focus Mode",
    "description": "Options page title"
  },
  "options_nav_general": {
    "message": "Geral",
    "description": "Options navigation — general section"
  },
  "options_nav_timer": {
    "message": "Temporizador",
    "description": "Options navigation — timer section"
  },
  "options_nav_blocklist": {
    "message": "Lista de bloqueio",
    "description": "Options navigation — blocklist section"
  },
  "options_nav_nuclear": {
    "message": "Nuclear Mode",
    "description": "Options navigation — Nuclear Mode section"
  },
  "options_nav_sounds": {
    "message": "Sons",
    "description": "Options navigation — sounds section"
  },
  "options_nav_stats": {
    "message": "Estatisticas",
    "description": "Options navigation — statistics section"
  },
  "options_nav_account": {
    "message": "Conta",
    "description": "Options navigation — account section"
  },
  "options_nav_about": {
    "message": "Sobre",
    "description": "Options navigation — about section"
  },

  "options_general_language": {
    "message": "Idioma",
    "description": "Language selector label"
  },
  "options_general_language_auto": {
    "message": "Automatico (idioma do navegador)",
    "description": "Auto-detect language option"
  },
  "options_general_theme": {
    "message": "Tema",
    "description": "Theme selector label"
  },
  "options_general_theme_light": {
    "message": "Claro",
    "description": "Light theme option"
  },
  "options_general_theme_dark": {
    "message": "Escuro",
    "description": "Dark theme option"
  },
  "options_general_theme_system": {
    "message": "Sistema",
    "description": "System theme option"
  },
  "options_general_notifications": {
    "message": "Notificacoes",
    "description": "Notifications toggle label"
  },
  "options_general_notifications_desc": {
    "message": "Mostrar notificacoes ao iniciar e encerrar sessoes",
    "description": "Notifications toggle description"
  },
  "options_general_badge": {
    "message": "Badge do icone",
    "description": "Badge icon toggle label"
  },
  "options_general_badge_desc": {
    "message": "Mostrar tempo restante no icone da extensao",
    "description": "Badge icon description"
  },
  "options_general_startup": {
    "message": "Iniciar com o navegador",
    "description": "Auto-start on browser open"
  },
  "options_general_startup_desc": {
    "message": "Iniciar automaticamente uma sessao de foco ao abrir o Chrome",
    "description": "Auto-start description"
  },

  "options_timer_focus_duration": {
    "message": "Duracao do foco",
    "description": "Focus duration setting label"
  },
  "options_timer_focus_duration_desc": {
    "message": "Duracao de cada sessao de foco em minutos",
    "description": "Focus duration description"
  },
  "options_timer_break_duration": {
    "message": "Duracao da pausa",
    "description": "Break duration setting label"
  },
  "options_timer_break_duration_desc": {
    "message": "Duracao de cada pausa curta em minutos",
    "description": "Break duration description"
  },
  "options_timer_long_break": {
    "message": "Pausa longa",
    "description": "Long break duration label"
  },
  "options_timer_long_break_desc": {
    "message": "Duracao da pausa longa em minutos",
    "description": "Long break duration description"
  },
  "options_timer_sessions_before_long": {
    "message": "Sessoes antes da pausa longa",
    "description": "Sessions before long break"
  },
  "options_timer_auto_start_break": {
    "message": "Iniciar pausa automaticamente",
    "description": "Auto-start break toggle"
  },
  "options_timer_auto_start_focus": {
    "message": "Iniciar foco automaticamente",
    "description": "Auto-start next focus toggle"
  },
  "options_timer_minutes_label": {
    "message": "minutos",
    "description": "Minutes unit label"
  },

  "options_blocklist_title": {
    "message": "Sites bloqueados",
    "description": "Blocklist section title"
  },
  "options_blocklist_add": {
    "message": "Adicionar site",
    "description": "Add site button"
  },
  "options_blocklist_add_placeholder": {
    "message": "Digite um dominio (ex. facebook.com)",
    "description": "Add site input placeholder"
  },
  "options_blocklist_remove": {
    "message": "Remover",
    "description": "Remove site button"
  },
  "options_blocklist_empty": {
    "message": "Nenhum site bloqueado. Adicione sites para bloquear durante as sessoes de foco.",
    "description": "Empty blocklist message"
  },
  "options_blocklist_import": {
    "message": "Importar lista",
    "description": "Import blocklist button"
  },
  "options_blocklist_export": {
    "message": "Exportar lista",
    "description": "Export blocklist button"
  },
  "options_blocklist_preset": {
    "message": "Listas prontas",
    "description": "Preset blocklist button"
  },
  "options_blocklist_preset_social": {
    "message": "Redes sociais",
    "description": "Social media preset"
  },
  "options_blocklist_preset_news": {
    "message": "Noticias",
    "description": "News sites preset"
  },
  "options_blocklist_preset_entertainment": {
    "message": "Entretenimento",
    "description": "Entertainment preset"
  },
  "options_blocklist_preset_shopping": {
    "message": "Compras",
    "description": "Shopping sites preset"
  },
  "options_blocklist_always_block": {
    "message": "Bloquear sempre",
    "description": "Always block toggle"
  },
  "options_blocklist_schedule": {
    "message": "Bloqueio programado",
    "description": "Schedule-based blocking"
  },

  "options_nuclear_title": {
    "message": "Configuracoes do Nuclear Mode",
    "description": "Nuclear Mode settings title"
  },
  "options_nuclear_desc": {
    "message": "Nuclear Mode bloqueia todos os sites da sua lista sem possibilidade de desativar ate o fim do tempo.",
    "description": "Nuclear Mode description"
  },
  "options_nuclear_duration": {
    "message": "Duracao do Nuclear Mode",
    "description": "Nuclear Mode duration label"
  },
  "options_nuclear_block_all": {
    "message": "Bloquear todos os sites (nao apenas a lista)",
    "description": "Block all sites option"
  },
  "options_nuclear_allowlist": {
    "message": "Sites permitidos no Nuclear Mode",
    "description": "Nuclear Mode allowlist"
  },
  "options_nuclear_allowlist_add": {
    "message": "Adicionar site permitido",
    "description": "Add to Nuclear Mode allowlist"
  },
  "options_nuclear_warning": {
    "message": "O Nuclear Mode nao pode ser desativado depois de iniciado. Use com cautela.",
    "description": "Nuclear Mode warning"
  },
  "options_nuclear_confirm": {
    "message": "Confirmar ativacao",
    "description": "Confirm Nuclear Mode activation"
  },

  "options_sounds_title": {
    "message": "Sons ambientes",
    "description": "Ambient sounds section title"
  },
  "options_sounds_enable": {
    "message": "Ativar sons durante o foco",
    "description": "Enable sounds toggle"
  },
  "options_sounds_volume": {
    "message": "Volume",
    "description": "Volume slider label"
  },
  "options_sounds_rain": {
    "message": "Chuva",
    "description": "Rain ambient sound"
  },
  "options_sounds_forest": {
    "message": "Floresta",
    "description": "Forest ambient sound"
  },
  "options_sounds_cafe": {
    "message": "Cafeteria",
    "description": "Cafe ambient sound"
  },
  "options_sounds_ocean": {
    "message": "Oceano",
    "description": "Ocean ambient sound"
  },
  "options_sounds_white_noise": {
    "message": "Ruido branco",
    "description": "White noise"
  },
  "options_sounds_fireplace": {
    "message": "Lareira",
    "description": "Fireplace ambient sound"
  },
  "options_sounds_notification": {
    "message": "Som de notificacao",
    "description": "Notification sound selector"
  },
  "options_sounds_notification_chime": {
    "message": "Sino",
    "description": "Chime notification sound"
  },
  "options_sounds_notification_bell": {
    "message": "Campainha",
    "description": "Bell notification sound"
  },
  "options_sounds_notification_none": {
    "message": "Sem som",
    "description": "No notification sound"
  },

  "options_stats_title": {
    "message": "Estatisticas",
    "description": "Statistics section title"
  },
  "options_stats_today": {
    "message": "Hoje",
    "description": "Today tab"
  },
  "options_stats_week": {
    "message": "Esta semana",
    "description": "This week tab"
  },
  "options_stats_month": {
    "message": "Este mes",
    "description": "This month tab"
  },
  "options_stats_all_time": {
    "message": "Todo o periodo",
    "description": "All time tab"
  },
  "options_stats_focus_time": {
    "message": "Tempo de foco",
    "description": "Focus time stat label"
  },
  "options_stats_sessions": {
    "message": "Sessoes concluidas",
    "description": "Completed sessions stat"
  },
  "options_stats_blocked": {
    "message": "Sites bloqueados",
    "description": "Sites blocked stat"
  },
  "options_stats_streak": {
    "message": "Melhor sequencia",
    "description": "Best streak stat"
  },
  "options_stats_avg_score": {
    "message": "Focus Score medio",
    "description": "Average Focus Score"
  },
  "options_stats_export": {
    "message": "Exportar dados",
    "description": "Export statistics data"
  },
  "options_stats_reset": {
    "message": "Redefinir estatisticas",
    "description": "Reset statistics button"
  },
  "options_stats_reset_confirm": {
    "message": "Todas as estatisticas serao excluidas permanentemente. Esta acao nao pode ser desfeita.",
    "description": "Reset confirmation message"
  },

  "options_account_title": {
    "message": "Conta",
    "description": "Account section title"
  },
  "options_account_plan_free": {
    "message": "Plano gratuito",
    "description": "Free plan label"
  },
  "options_account_plan_pro": {
    "message": "Focus Mode Pro",
    "description": "Pro plan label"
  },
  "options_account_upgrade": {
    "message": "Assinar o Pro",
    "description": "Upgrade button"
  },
  "options_account_manage": {
    "message": "Gerenciar assinatura",
    "description": "Manage subscription link"
  },
  "options_account_restore": {
    "message": "Restaurar compra",
    "description": "Restore purchase button"
  },
  "options_account_data_sync": {
    "message": "Sincronizacao de dados",
    "description": "Data sync toggle"
  },
  "options_account_data_sync_desc": {
    "message": "Sincronizar configuracoes entre dispositivos (requer Pro)",
    "description": "Data sync description"
  },

  "options_about_title": {
    "message": "Sobre o Focus Mode",
    "description": "About section title"
  },
  "options_about_version": {
    "message": "Versao $VERSION$",
    "description": "Version display",
    "placeholders": {
      "version": { "content": "$1", "example": "1.0.0" }
    }
  },
  "options_about_developer": {
    "message": "Desenvolvido por Zovo",
    "description": "Developer credit"
  },
  "options_about_rate": {
    "message": "Avaliar na Chrome Web Store",
    "description": "Rate extension link"
  },
  "options_about_feedback": {
    "message": "Enviar feedback",
    "description": "Feedback link"
  },
  "options_about_privacy": {
    "message": "Politica de privacidade",
    "description": "Privacy policy link"
  },
  "options_about_terms": {
    "message": "Termos de servico",
    "description": "Terms of service link"
  },
  "options_about_changelog": {
    "message": "Registro de alteracoes",
    "description": "Changelog link"
  },
  "options_about_support": {
    "message": "Central de ajuda",
    "description": "Support/help center link"
  },

  "block_page_title": {
    "message": "Site bloqueado",
    "description": "Block page title"
  },
  "block_page_heading": {
    "message": "Este site esta bloqueado",
    "description": "Block page main heading"
  },
  "block_page_description": {
    "message": "$SITE$ esta bloqueado durante sua sessao de foco. Mantenha o foco no que importa.",
    "description": "Block page description",
    "placeholders": {
      "site": { "content": "$1", "example": "facebook.com" }
    }
  },
  "block_page_time_remaining": {
    "message": "Tempo restante: $TIME$",
    "description": "Time remaining on block page",
    "placeholders": {
      "time": { "content": "$1", "example": "18:32" }
    }
  },
  "block_page_nuclear_active": {
    "message": "Nuclear Mode esta ativo. Este site nao pode ser desbloqueado.",
    "description": "Nuclear Mode active message"
  },
  "block_page_btn_go_back": {
    "message": "Voltar",
    "description": "Go back button on block page"
  },
  "block_page_btn_dashboard": {
    "message": "Ir ao painel",
    "description": "Go to dashboard button"
  },
  "block_page_focus_score": {
    "message": "Seu Focus Score: $SCORE$",
    "description": "Focus Score display on block page",
    "placeholders": {
      "score": { "content": "$1", "example": "85" }
    }
  },
  "block_page_sessions_today": {
    "message": "Sessoes hoje: $COUNT$",
    "description": "Sessions today on block page",
    "placeholders": {
      "count": { "content": "$1", "example": "3" }
    }
  },
  "block_page_streak": {
    "message": "Sequencia atual: $DAYS$ dias",
    "description": "Current streak on block page",
    "placeholders": {
      "days": { "content": "$1", "example": "7" }
    }
  },

  "block_page_quote_1": {
    "message": "Disciplina e a ponte entre metas e realizacoes.",
    "description": "Motivational quote 1 — Jim Rohn"
  },
  "block_page_quote_2": {
    "message": "O sucesso e a soma de pequenos esforcos repetidos dia apos dia.",
    "description": "Motivational quote 2 — Robert Collier"
  },
  "block_page_quote_3": {
    "message": "Foque em ser produtivo, nao em estar ocupado.",
    "description": "Motivational quote 3 — Tim Ferriss"
  },
  "block_page_quote_4": {
    "message": "A concentracao e a raiz de todas as capacidades humanas.",
    "description": "Motivational quote 4 — Bruce Lee"
  },
  "block_page_quote_5": {
    "message": "Nao e que temos pouco tempo, e que desperdicamos muito.",
    "description": "Motivational quote 5 — Seneca"
  },
  "block_page_quote_6": {
    "message": "O futuro depende do que voce faz hoje.",
    "description": "Motivational quote 6 — Mahatma Gandhi"
  },
  "block_page_quote_7": {
    "message": "Onde ha foco, ha poder.",
    "description": "Motivational quote 7 — Tony Robbins"
  },
  "block_page_quote_8": {
    "message": "A melhor maneira de prever o futuro e cria-lo.",
    "description": "Motivational quote 8 — Peter Drucker"
  },
  "block_page_quote_9": {
    "message": "Cada momento e uma nova oportunidade para mudar sua vida.",
    "description": "Motivational quote 9"
  },
  "block_page_quote_10": {
    "message": "Agua mole em pedra dura, tanto bate ate que fura.",
    "description": "Motivational quote 10 — Brazilian proverb (Persistence breaks resistance)"
  },

  "onboarding_welcome_title": {
    "message": "Bem-vindo ao Focus Mode",
    "description": "Onboarding slide 1 title"
  },
  "onboarding_welcome_desc": {
    "message": "Bloqueie distracoes, aumente sua produtividade e alcance suas metas com sessoes de foco estruturadas.",
    "description": "Onboarding slide 1 description"
  },
  "onboarding_blocklist_title": {
    "message": "Configure sua lista de bloqueio",
    "description": "Onboarding slide 2 title"
  },
  "onboarding_blocklist_desc": {
    "message": "Adicione os sites que te distraem. Vamos bloquea-los durante suas sessoes de foco para que voce possa se concentrar.",
    "description": "Onboarding slide 2 description"
  },
  "onboarding_timer_title": {
    "message": "Personalize seu temporizador",
    "description": "Onboarding slide 3 title"
  },
  "onboarding_timer_desc": {
    "message": "Defina a duracao das suas sessoes de foco e pausas. Use a tecnica Pomodoro ou crie seu proprio ritmo.",
    "description": "Onboarding slide 3 description"
  },
  "onboarding_score_title": {
    "message": "Conheca seu Focus Score",
    "description": "Onboarding slide 4 title"
  },
  "onboarding_score_desc": {
    "message": "Seu Focus Score (0-100) mede seu nivel de concentracao. Complete sessoes, evite distracoes e construa sequencias para melhorar sua pontuacao.",
    "description": "Onboarding slide 4 description"
  },
  "onboarding_ready_title": {
    "message": "Pronto para focar",
    "description": "Onboarding slide 5 title"
  },
  "onboarding_ready_desc": {
    "message": "Tudo pronto. Inicie sua primeira sessao de foco e comece a ser mais produtivo agora mesmo.",
    "description": "Onboarding slide 5 description"
  },
  "onboarding_btn_next": {
    "message": "Proximo",
    "description": "Next button in onboarding"
  },
  "onboarding_btn_skip": {
    "message": "Pular",
    "description": "Skip button in onboarding"
  },
  "onboarding_btn_back": {
    "message": "Voltar",
    "description": "Back button in onboarding"
  },
  "onboarding_btn_get_started": {
    "message": "Comecar",
    "description": "Get started button"
  },
  "onboarding_btn_add_sites": {
    "message": "Adicionar sites",
    "description": "Add sites button in onboarding"
  },
  "onboarding_progress": {
    "message": "$CURRENT$ de $TOTAL$",
    "description": "Onboarding progress indicator",
    "placeholders": {
      "current": { "content": "$1", "example": "2" },
      "total": { "content": "$2", "example": "5" }
    }
  },

  "notification_focus_started": {
    "message": "Sessao de foco iniciada. $MINS$ minutos de concentracao.",
    "description": "Focus session started notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "25" }
    }
  },
  "notification_focus_complete": {
    "message": "Sessao de foco concluida. Otimo trabalho!",
    "description": "Focus session complete notification"
  },
  "notification_break_started": {
    "message": "Hora da pausa. Relaxe por $MINS$ minutos.",
    "description": "Break started notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "5" }
    }
  },
  "notification_break_over": {
    "message": "Pausa encerrada. Pronto para a proxima sessao.",
    "description": "Break over notification"
  },
  "notification_nuclear_started": {
    "message": "Nuclear Mode ativado por $MINS$ minutos. Todos os sites estao bloqueados.",
    "description": "Nuclear Mode started notification",
    "placeholders": {
      "mins": { "content": "$1", "example": "60" }
    }
  },
  "notification_nuclear_ended": {
    "message": "Nuclear Mode encerrado. Os sites foram desbloqueados.",
    "description": "Nuclear Mode ended notification"
  },
  "notification_streak_milestone": {
    "message": "Sequencia de $DAYS$ dias. Continue assim!",
    "description": "Streak milestone notification",
    "placeholders": {
      "days": { "content": "$1", "example": "7" }
    }
  },
  "notification_score_improved": {
    "message": "Seu Focus Score subiu para $SCORE$.",
    "description": "Focus Score improvement notification",
    "placeholders": {
      "score": { "content": "$1", "example": "90" }
    }
  },
  "notification_daily_goal": {
    "message": "Meta diaria atingida. Voce completou $COUNT$ sessoes hoje.",
    "description": "Daily goal completed notification",
    "placeholders": {
      "count": { "content": "$1", "example": "4" }
    }
  },

  "error_invalid_url": {
    "message": "URL invalida. Digite um dominio correto.",
    "description": "Invalid URL error"
  },
  "error_duplicate_site": {
    "message": "Este site ja esta na lista de bloqueio.",
    "description": "Duplicate site error"
  },
  "error_storage_full": {
    "message": "Armazenamento cheio. Exclua alguns dados para continuar.",
    "description": "Storage full error"
  },
  "error_network": {
    "message": "Erro de conexao. Verifique sua conexao com a internet.",
    "description": "Network error"
  },
  "error_generic": {
    "message": "Algo deu errado. Tente novamente.",
    "description": "Generic error message"
  },
  "error_permission_denied": {
    "message": "Permissao negada. Verifique as permissoes da extensao.",
    "description": "Permission denied error"
  },
  "error_session_conflict": {
    "message": "Ja existe uma sessao ativa.",
    "description": "Session conflict error"
  },
  "error_nuclear_active": {
    "message": "As configuracoes nao podem ser alteradas enquanto o Nuclear Mode estiver ativo.",
    "description": "Cannot modify during Nuclear Mode"
  },
  "error_import_invalid": {
    "message": "Arquivo de importacao invalido.",
    "description": "Invalid import file error"
  },
  "error_export_failed": {
    "message": "Falha ao exportar dados.",
    "description": "Export failed error"
  },

  "paywall_title": {
    "message": "Desbloqueie o Focus Mode Pro",
    "description": "Paywall title (T1)"
  },
  "paywall_subtitle": {
    "message": "Leve sua produtividade para o proximo nivel",
    "description": "Paywall subtitle (T2)"
  },
  "paywall_feature_1": {
    "message": "Sites bloqueados ilimitados",
    "description": "Pro feature 1 (T3)"
  },
  "paywall_feature_2": {
    "message": "Estatisticas detalhadas e graficos",
    "description": "Pro feature 2 (T4)"
  },
  "paywall_feature_3": {
    "message": "Nuclear Mode avancado",
    "description": "Pro feature 3 (T5)"
  },
  "paywall_feature_4": {
    "message": "Sons ambientes premium",
    "description": "Pro feature 4 (T6)"
  },
  "paywall_feature_5": {
    "message": "Sincronizacao entre dispositivos",
    "description": "Pro feature 5 (T7)"
  },
  "paywall_feature_6": {
    "message": "Bloqueio programado personalizado",
    "description": "Pro feature 6 (T8)"
  },
  "paywall_price_monthly": {
    "message": "$PRICE$/mes",
    "description": "Monthly price display (T9)",
    "placeholders": {
      "price": { "content": "$1", "example": "R$ 24,90" }
    }
  },
  "paywall_price_lifetime": {
    "message": "$PRICE$ pagamento unico",
    "description": "Lifetime price display (T10)",
    "placeholders": {
      "price": { "content": "$1", "example": "R$ 249,90" }
    }
  },
  "paywall_btn_subscribe": {
    "message": "Assinar o Pro",
    "description": "Subscribe button"
  },
  "paywall_btn_lifetime": {
    "message": "Comprar vitalicio",
    "description": "Lifetime purchase button"
  },
  "paywall_btn_restore": {
    "message": "Restaurar compra",
    "description": "Restore purchase button"
  },
  "paywall_guarantee": {
    "message": "Garantia de reembolso de 30 dias",
    "description": "Money-back guarantee"
  },
  "paywall_trial": {
    "message": "7 dias de teste gratis",
    "description": "Free trial text"
  },
  "paywall_cancel_anytime": {
    "message": "Cancele quando quiser",
    "description": "Cancel anytime text"
  },

  "achievement_first_session": {
    "message": "Primeira sessao concluida",
    "description": "First session achievement"
  },
  "achievement_ten_sessions": {
    "message": "10 sessoes concluidas",
    "description": "10 sessions achievement"
  },
  "achievement_hundred_sessions": {
    "message": "100 sessoes concluidas",
    "description": "100 sessions achievement"
  },
  "achievement_first_streak": {
    "message": "Primeira sequencia de 3 dias",
    "description": "First 3-day streak"
  },
  "achievement_week_streak": {
    "message": "Sequencia de 7 dias",
    "description": "7-day streak achievement"
  },
  "achievement_month_streak": {
    "message": "Sequencia de 30 dias",
    "description": "30-day streak achievement"
  },
  "achievement_focus_master": {
    "message": "Focus Score de 90+",
    "description": "Focus Score 90+ achievement"
  },
  "achievement_nuclear_survivor": {
    "message": "Sobreviveu ao Nuclear Mode",
    "description": "Completed Nuclear Mode session"
  },
  "achievement_early_bird": {
    "message": "Madrugador — sessao antes das 7h",
    "description": "Early bird achievement"
  },
  "achievement_night_owl": {
    "message": "Coruja — sessao apos as 23h",
    "description": "Night owl achievement"
  },
  "achievement_unlocked": {
    "message": "Conquista desbloqueada: $NAME$",
    "description": "Achievement unlocked notification",
    "placeholders": {
      "name": { "content": "$1", "example": "Primeira sessao" }
    }
  },

  "streak_lost": {
    "message": "Sequencia perdida. Comece uma nova hoje.",
    "description": "Streak lost message"
  },
  "streak_at_risk": {
    "message": "Sua sequencia de $DAYS$ dias esta em risco. Complete uma sessao hoje.",
    "description": "Streak at risk warning",
    "placeholders": {
      "days": { "content": "$1", "example": "5" }
    }
  },
  "streak_protected": {
    "message": "Sequencia protegida (Pro)",
    "description": "Streak protection Pro feature"
  },
  "streak_frozen": {
    "message": "Sequencia congelada por hoje",
    "description": "Streak freeze active"
  },
  "streak_new_record": {
    "message": "Novo recorde de sequencia: $DAYS$ dias",
    "description": "New streak record",
    "placeholders": {
      "days": { "content": "$1", "example": "14" }
    }
  },

  "common_save": {
    "message": "Salvar",
    "description": "Save button"
  },
  "common_cancel": {
    "message": "Cancelar",
    "description": "Cancel button"
  },
  "common_confirm": {
    "message": "Confirmar",
    "description": "Confirm button"
  },
  "common_delete": {
    "message": "Excluir",
    "description": "Delete button"
  },
  "common_edit": {
    "message": "Editar",
    "description": "Edit button"
  },
  "common_close": {
    "message": "Fechar",
    "description": "Close button"
  },
  "common_done": {
    "message": "Concluido",
    "description": "Done button"
  },
  "common_loading": {
    "message": "Carregando...",
    "description": "Loading state"
  },
  "common_enabled": {
    "message": "Ativado",
    "description": "Enabled state"
  },
  "common_disabled": {
    "message": "Desativado",
    "description": "Disabled state"
  },
  "common_on": {
    "message": "Ligado",
    "description": "On toggle state"
  },
  "common_off": {
    "message": "Desligado",
    "description": "Off toggle state"
  },
  "common_yes": {
    "message": "Sim",
    "description": "Yes"
  },
  "common_no": {
    "message": "Nao",
    "description": "No"
  },
  "common_ok": {
    "message": "OK",
    "description": "OK button"
  },
  "common_reset": {
    "message": "Redefinir",
    "description": "Reset button"
  },
  "common_retry": {
    "message": "Tentar novamente",
    "description": "Retry button"
  },
  "common_learn_more": {
    "message": "Saiba mais",
    "description": "Learn more link"
  },
  "common_pro_badge": {
    "message": "Pro",
    "description": "Pro badge label — brand term"
  },
  "common_free_badge": {
    "message": "Gratis",
    "description": "Free badge label"
  },
  "common_new_badge": {
    "message": "Novo",
    "description": "New badge label"
  },
  "common_hours": {
    "message": "$COUNT$h",
    "description": "Hours abbreviation",
    "placeholders": {
      "count": { "content": "$1", "example": "2" }
    }
  },
  "common_minutes": {
    "message": "$COUNT$min",
    "description": "Minutes abbreviation",
    "placeholders": {
      "count": { "content": "$1", "example": "30" }
    }
  },
  "common_seconds": {
    "message": "$COUNT$s",
    "description": "Seconds abbreviation",
    "placeholders": {
      "count": { "content": "$1", "example": "45" }
    }
  },
  "common_days": {
    "message": "$COUNT$ dias",
    "description": "Days with count",
    "placeholders": {
      "count": { "content": "$1", "example": "7" }
    }
  },
  "common_today": {
    "message": "Hoje",
    "description": "Today"
  },
  "common_yesterday": {
    "message": "Ontem",
    "description": "Yesterday"
  },
  "common_this_week": {
    "message": "Esta semana",
    "description": "This week"
  },
  "common_all_time": {
    "message": "Todo o periodo",
    "description": "All time"
  }
}
```

**Brazilian Portuguese translation notes:**
- Total entries: 210+
- Voce-form used throughout (standard Brazilian Portuguese for software UI, not tu-form)
- Brazilian vocabulary preferred over European Portuguese: "tela" over "ecra", "celular" over "telemovel", "gratis" natural to both
- Includes Brazilian proverb in motivational quotes (Agua mole em pedra dura)
- Text length similar to Spanish (~10-15% longer than English)
- PPP pricing example uses R$ (Brazilian Real) in placeholder examples

---

## 6. Integration Architecture

### 6.1 How i18n Integrates with Existing Modules

Focus Mode - Blocker is built on Manifest V3 with a service worker, content scripts, popup, options page, onboarding flow, and block page. The i18n system must integrate with each of these execution contexts without requiring a new cross-context messaging protocol.

#### 6.1.1 Service Worker (Background)

The service worker (`src/background/service-worker.js`) is responsible for timer management, notification dispatching, badge text updates, and DNR rule management. It uses i18n in these areas:

**Notification text:**
```javascript
// Before (hardcoded)
chrome.notifications.create('focus-complete', {
  title: 'Focus Session Complete',
  message: 'Great work! Time for a break.'
});

// After (i18n)
chrome.notifications.create('focus-complete', {
  title: chrome.i18n.getMessage('notification_focus_complete'),
  message: chrome.i18n.getMessage('notification_break_started', ['5'])
});
```

**Badge text:**
The badge displays remaining time. Numbers are universal, but the service worker should use `chrome.i18n.getMessage()` for any textual badge content (e.g., "ON", "OFF" states).

```javascript
// Badge states
const badgeText = isActive
  ? formatTimeShort(remaining) // "25:00" — numeric, no i18n needed
  : chrome.i18n.getMessage('common_off'); // "OFF" → localized
```

**Error messages in console/logging:**
Error messages logged internally do not need i18n (they are for developer debugging). Only user-facing error messages dispatched via notifications or sent to content scripts for display need localization.

**No new message types needed:** The service worker already sends state updates to the popup and content scripts via `chrome.runtime.sendMessage()`. These messages contain state data (timer values, session counts), not display text. Each UI context generates its own display text from the state data using `chrome.i18n.getMessage()`. This preserves the existing message architecture.

#### 6.1.2 Content Scripts (Block Page)

The block page is injected by the content script when a user navigates to a blocked site. It uses a shadow DOM for style isolation.

**Block page text injection:**
```javascript
// src/content/block-page.js
function renderBlockPage(siteUrl, timeRemaining, focusScore, sessionsToday, streakDays) {
  const shadow = this.attachShadow({ mode: 'closed' });

  // All text pulled from i18n
  const heading = chrome.i18n.getMessage('block_page_heading');
  const description = chrome.i18n.getMessage('block_page_description', [siteUrl]);
  const timeLabel = chrome.i18n.getMessage('block_page_time_remaining', [timeRemaining]);

  // Motivational quote rotation
  const quoteIndex = Math.floor(Math.random() * 10) + 1;
  const quote = chrome.i18n.getMessage(`block_page_quote_${quoteIndex}`);

  // Inject into shadow DOM
  shadow.innerHTML = `
    <div class="block-page" dir="${chrome.i18n.getMessage('@@bidi_dir')}">
      <h1>${heading}</h1>
      <p>${description}</p>
      <div class="timer">${timeLabel}</div>
      <blockquote>${quote}</blockquote>
    </div>
  `;
}
```

**Shadow DOM localization:** The shadow DOM isolates styles but not JavaScript. `chrome.i18n.getMessage()` is available in content scripts and works inside shadow DOM rendering functions.

**RTL support in shadow DOM:** The `@@bidi_dir` predefined message provides the correct direction (`ltr` or `rtl`). This is applied to the root element of the shadow DOM.

#### 6.1.3 Popup

The popup (`src/popup/popup.js`) is the primary user interface, with 6 states (idle, focus, break, long break, nuclear, paused).

**I18nManager initialization:**
```javascript
// src/popup/popup.js
import { I18nManager } from '../shared/i18n-manager.js';

document.addEventListener('DOMContentLoaded', async () => {
  const i18n = new I18nManager();
  await i18n.localizeDocument(); // Scans data-i18n attributes

  // Dynamic state text updates (called on every state change)
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'STATE_UPDATE') {
      updatePopupUI(msg.state, i18n);
    }
  });
});

function updatePopupUI(state, i18n) {
  // State label
  const stateLabel = document.getElementById('state-label');
  stateLabel.textContent = chrome.i18n.getMessage(`popup_state_${state.currentState}`);

  // Sessions today (dynamic count)
  const sessionsEl = document.getElementById('sessions-today');
  sessionsEl.textContent = chrome.i18n.getMessage('popup_sessions_today', [state.sessionsToday]);

  // Focus Score
  const scoreEl = document.getElementById('focus-score');
  scoreEl.textContent = chrome.i18n.getMessage('popup_focus_score_value', [state.focusScore]);

  // Streak
  const streakEl = document.getElementById('streak');
  streakEl.textContent = chrome.i18n.getMessage('popup_streak_days', [state.streakDays]);
}
```

**Static vs. dynamic text:** Static text (button labels, section headers) uses `data-i18n` attributes and is localized once on page load. Dynamic text (timer, session count, Focus Score) is updated programmatically with `chrome.i18n.getMessage()` on each state change.

#### 6.1.4 Options Page

The options page (`src/popup/options.js` or `src/options/options.js`) has 8 sections. Most content is static labels and descriptions.

**Form labels and section headers:**
```html
<!-- options.html -->
<h2 data-i18n="options_nav_general"></h2>
<label data-i18n="options_general_language"></label>
<select id="language-select">
  <option value="auto" data-i18n="options_general_language_auto"></option>
  <option value="en">English</option>
  <option value="es">Espanol</option>
  <option value="de">Deutsch</option>
  <option value="ja">日本語</option>
  <option value="fr">Francais</option>
  <option value="pt_BR">Portugues (Brasil)</option>
</select>
<p class="desc" data-i18n="options_general_notifications_desc"></p>
```

**Dynamic content:** The statistics section (section 6) has dynamic numbers that use parameterized messages. The blocklist section (section 3) has a dynamic list of sites that does not need i18n (URLs are universal), but the empty-state message and action buttons do.

#### 6.1.5 Onboarding

The onboarding flow (`src/popup/onboarding.js` or `src/onboarding/`) has 5 slides.

**Slide text and CTA buttons:**
```javascript
// src/onboarding/onboarding.js
const slides = [
  {
    titleKey: 'onboarding_welcome_title',
    descKey: 'onboarding_welcome_desc',
    ctaKey: 'onboarding_btn_next'
  },
  {
    titleKey: 'onboarding_blocklist_title',
    descKey: 'onboarding_blocklist_desc',
    ctaKey: 'onboarding_btn_add_sites'
  },
  // ... slides 3-4 ...
  {
    titleKey: 'onboarding_ready_title',
    descKey: 'onboarding_ready_desc',
    ctaKey: 'onboarding_btn_get_started'
  }
];

function renderSlide(index) {
  const slide = slides[index];
  document.getElementById('slide-title').textContent = chrome.i18n.getMessage(slide.titleKey);
  document.getElementById('slide-desc').textContent = chrome.i18n.getMessage(slide.descKey);
  document.getElementById('slide-cta').textContent = chrome.i18n.getMessage(slide.ctaKey);

  // Progress indicator
  document.getElementById('progress').textContent =
    chrome.i18n.getMessage('onboarding_progress', [index + 1, slides.length]);

  // Skip/Back navigation
  document.getElementById('skip-btn').textContent = chrome.i18n.getMessage('onboarding_btn_skip');
  document.getElementById('back-btn').textContent = chrome.i18n.getMessage('onboarding_btn_back');
  document.getElementById('back-btn').style.display = index === 0 ? 'none' : 'inline';
}
```

#### 6.1.6 Block Page (Detailed)

**Motivational quotes rotation:**
```javascript
// Rotate quotes — all 10 quotes are in messages.json per locale
function getRandomQuote() {
  const index = Math.floor(Math.random() * 10) + 1;
  return chrome.i18n.getMessage(`block_page_quote_${index}`);
}
```

**Timer labels:** The timer on the block page shows a countdown. The numeric format (mm:ss) is universal, but the "Time remaining:" label is localized.

**Stats display:** Focus Score, sessions count, and streak days on the block page use parameterized messages for proper number placement per locale.

### 6.2 New Modules

#### 6.2.1 `src/shared/i18n-manager.js`

Shared class used by popup, options, onboarding, and block page to localize HTML documents.

```javascript
/**
 * I18nManager — DOM-based localization helper
 * Scans document for data-i18n attributes and replaces content
 * with chrome.i18n.getMessage() results.
 */
export class I18nManager {
  constructor(rootElement = document) {
    this.root = rootElement;
  }

  /**
   * Localize all elements with data-i18n attribute.
   * Supports:
   *   data-i18n="key" — sets textContent
   *   data-i18n-placeholder="key" — sets placeholder attribute
   *   data-i18n-title="key" — sets title attribute
   *   data-i18n-aria="key" — sets aria-label attribute
   *   data-i18n-args='["arg1","arg2"]' — substitution args (JSON array)
   */
  localizeDocument() {
    // Text content
    this.root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const args = this._getArgs(el);
      const msg = chrome.i18n.getMessage(key, args);
      if (msg) el.textContent = msg;
    });

    // Placeholder attributes
    this.root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const msg = chrome.i18n.getMessage(key);
      if (msg) el.placeholder = msg;
    });

    // Title attributes
    this.root.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const msg = chrome.i18n.getMessage(key);
      if (msg) el.title = msg;
    });

    // Aria-label attributes
    this.root.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const msg = chrome.i18n.getMessage(key);
      if (msg) el.setAttribute('aria-label', msg);
    });

    // Set document direction
    document.documentElement.dir = chrome.i18n.getMessage('@@bidi_dir');
    document.documentElement.lang = chrome.i18n.getUILanguage();
  }

  /**
   * Localize a single element by key.
   */
  localize(element, key, args = []) {
    const msg = chrome.i18n.getMessage(key, args);
    if (msg) element.textContent = msg;
    return msg;
  }

  /**
   * Get a localized string directly.
   */
  get(key, args = []) {
    return chrome.i18n.getMessage(key, args);
  }

  _getArgs(el) {
    const argsAttr = el.getAttribute('data-i18n-args');
    if (!argsAttr) return [];
    try {
      return JSON.parse(argsAttr);
    } catch {
      return [];
    }
  }
}
```

#### 6.2.2 `src/shared/locale-formatter.js`

Handles date, time, and number formatting per locale using the `Intl` API.

```javascript
/**
 * LocaleFormatter — date/time/number formatting per user's locale
 * Uses Intl API for locale-aware formatting.
 */
export class LocaleFormatter {
  constructor(locale = null) {
    // Use explicit locale or fall back to Chrome's UI language
    this.locale = locale || chrome.i18n.getUILanguage();
  }

  /**
   * Format a date for display.
   * @param {Date} date
   * @param {string} style - 'short', 'medium', 'long', 'full'
   */
  formatDate(date, style = 'medium') {
    const options = {
      short: { month: 'numeric', day: 'numeric' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { month: 'long', day: 'numeric', year: 'numeric' },
      full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    };
    return new Intl.DateTimeFormat(this.locale, options[style]).format(date);
  }

  /**
   * Format a time for display.
   * @param {Date} date
   * @param {boolean} includeSeconds
   */
  formatTime(date, includeSeconds = false) {
    const options = {
      hour: 'numeric',
      minute: '2-digit',
      ...(includeSeconds && { second: '2-digit' })
    };
    return new Intl.DateTimeFormat(this.locale, options).format(date);
  }

  /**
   * Format a number for display.
   * @param {number} num
   * @param {object} options - Intl.NumberFormat options
   */
  formatNumber(num, options = {}) {
    return new Intl.NumberFormat(this.locale, options).format(num);
  }

  /**
   * Format currency for display.
   * @param {number} amount
   * @param {string} currency - ISO 4217 code (USD, EUR, JPY, BRL)
   */
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency
    }).format(amount);
  }

  /**
   * Format relative time (e.g., "2 hours ago", "in 5 minutes").
   * @param {number} value
   * @param {string} unit - 'second', 'minute', 'hour', 'day', 'week', 'month', 'year'
   */
  formatRelativeTime(value, unit) {
    return new Intl.RelativeTimeFormat(this.locale, {
      numeric: 'auto'
    }).format(value, unit);
  }

  /**
   * Format a duration as h:mm:ss or mm:ss.
   * Duration formatting is universal (numeric), so this is locale-agnostic.
   */
  formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
}
```

#### 6.2.3 `src/shared/strings.js`

Helper for string externalization — a thin wrapper around `chrome.i18n.getMessage()` with fallback support.

```javascript
/**
 * Strings — string externalization helper with fallback.
 * Usage: Strings.get('popup_state_idle')  // → "Ready to focus"
 *        Strings.get('popup_sessions_today', [4])  // → "4 sessions today"
 */
export const Strings = {
  /**
   * Get a localized string by key.
   * Falls back to key name if message is not found (development aid).
   */
  get(key, substitutions = []) {
    const msg = chrome.i18n.getMessage(key, substitutions);
    if (!msg) {
      console.warn(`[i18n] Missing translation for key: ${key}`);
      return `[${key}]`; // Development fallback — makes missing strings visible
    }
    return msg;
  },

  /**
   * Get the current UI language.
   */
  getLanguage() {
    return chrome.i18n.getUILanguage();
  },

  /**
   * Get the text direction for the current language.
   */
  getDirection() {
    return chrome.i18n.getMessage('@@bidi_dir') || 'ltr';
  },

  /**
   * Check if the current language is RTL.
   */
  isRTL() {
    return this.getDirection() === 'rtl';
  }
};
```

#### 6.2.4 `src/shared/rtl-manager.js`

RTL detection and CSS application for Arabic, Hebrew, Persian, and Urdu locales.

```javascript
/**
 * RTLManager — detects RTL locale and applies directional CSS.
 * Designed for future RTL locale support (ar, he, fa, ur).
 */
export class RTLManager {
  constructor() {
    this.isRTL = chrome.i18n.getMessage('@@bidi_dir') === 'rtl';
  }

  /**
   * Apply RTL direction to the document root.
   */
  apply() {
    if (this.isRTL) {
      document.documentElement.setAttribute('dir', 'rtl');
      document.body.classList.add('rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.body.classList.remove('rtl');
    }
  }

  /**
   * Apply RTL to a shadow root.
   */
  applyShadow(shadowRoot) {
    const host = shadowRoot.host || shadowRoot;
    if (this.isRTL) {
      host.setAttribute('dir', 'rtl');
    } else {
      host.setAttribute('dir', 'ltr');
    }
  }

  /**
   * Get the logical CSS property name for a physical property.
   * Maps left/right to inline-start/inline-end for RTL compatibility.
   */
  static logicalProperty(physicalProperty) {
    const map = {
      'margin-left': 'margin-inline-start',
      'margin-right': 'margin-inline-end',
      'padding-left': 'padding-inline-start',
      'padding-right': 'padding-inline-end',
      'border-left': 'border-inline-start',
      'border-right': 'border-inline-end',
      'left': 'inset-inline-start',
      'right': 'inset-inline-end',
      'text-align: left': 'text-align: start',
      'text-align: right': 'text-align: end'
    };
    return map[physicalProperty] || physicalProperty;
  }
}
```

### 6.3 Build Integration

**Locale files in dist:**
The Vite/Webpack build process must copy `_locales/` to the dist output alongside the manifest, scripts, and assets.

```javascript
// vite.config.js addition
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';

export default {
  // ... existing config
  plugins: [
    {
      name: 'copy-locales',
      writeBundle() {
        const localesDir = path.resolve(__dirname, '_locales');
        const distLocalesDir = path.resolve(__dirname, 'dist/_locales');

        readdirSync(localesDir).forEach(locale => {
          const src = path.join(localesDir, locale, 'messages.json');
          const destDir = path.join(distLocalesDir, locale);
          mkdirSync(destDir, { recursive: true });
          copyFileSync(src, path.join(destDir, 'messages.json'));
        });
      }
    }
  ]
};
```

**String extraction in build pipeline:**
A custom script scans source files for hardcoded strings and reports them as warnings during build. This is a linting step, not a blocker.

```javascript
// scripts/check-i18n.js
// Run as: node scripts/check-i18n.js
// Scans src/ for common hardcoded string patterns
// Reports any strings not wrapped in chrome.i18n.getMessage()
```

### 6.4 Storage

**Language preference:**
```javascript
// settings.language stored in chrome.storage.sync
// Values: 'auto' (default), 'en', 'es', 'de', 'ja', 'fr', 'pt_BR'
// Note: chrome.i18n always uses Chrome's language setting at the API level.
// The settings.language override is used for:
//   1. CWS locale recommendation in options page
//   2. Locale-specific formatting (dates, numbers, currency)
//   3. Showing the correct language in the language selector
// chrome.i18n.getMessage() itself always uses Chrome's resolved locale.
```

**Important limitation:** `chrome.i18n.getMessage()` cannot be overridden at runtime. It always uses Chrome's resolved locale (based on browser language and available `_locales/` in the extension). The `settings.language` preference is for features beyond the Chrome i18n API: formatting, analytics segmentation, and UI state.

### 6.5 Message Types

**No new message types needed.** The i18n system operates per-context:
- Each execution context (popup, options, onboarding, block page, service worker) has access to `chrome.i18n.getMessage()` directly.
- State data is passed between contexts via existing `chrome.runtime.sendMessage()` and `chrome.storage` — this data is numeric/boolean, not localized text.
- Each UI context generates its own display text from the state data using i18n APIs locally.
- This design avoids the anti-pattern of sending localized strings between contexts, which would break if contexts had different locales (unlikely but possible in development).

---

## 7. Migration Guide

### 7.1 Step-by-Step Migration Process

#### Step 1: Run String Extraction Script

Scan all source files to identify hardcoded user-facing strings.

```bash
# Extract all string literals from JavaScript source files
node scripts/extract-strings.js src/ > extracted-strings.txt
```

The extraction script identifies strings in:
- `textContent` assignments
- `innerHTML` template literals
- `chrome.notifications.create()` calls
- `alert()` / `confirm()` calls (should not exist, but check)
- Template literal strings with user-facing text

**Expected output:** A list of ~500+ hardcoded strings with file locations and suggested message keys.

**Time estimate:** 2-4 hours (script development + review of output)

#### Step 2: Create en/messages.json with All Extracted Strings

Using the extracted strings, create the master English locale file.

```
_locales/
└── en/
    └── messages.json    ← Master file with 500+ entries
```

**Key naming convention:**
- `{context}_{section}_{element}` — e.g., `popup_btn_start_focus`, `options_timer_focus_duration`
- Contexts: `popup`, `options`, `block_page`, `onboarding`, `notification`, `error`, `paywall`, `achievement`, `streak`, `common`
- All keys in snake_case
- Brand terms get their own top-level keys: `extension_name`, `extension_description`

**Time estimate:** 4-6 hours (creating file, writing descriptions, defining placeholders)

#### Step 3: Replace Hardcoded Strings with chrome.i18n.getMessage()

Systematically replace each hardcoded string in JavaScript source files.

**JavaScript replacement pattern:**
```javascript
// Before
element.textContent = 'Start Focus';

// After
element.textContent = chrome.i18n.getMessage('popup_btn_start_focus');
```

**Template literal replacement:**
```javascript
// Before
const msg = `${count} sessions today`;

// After
const msg = chrome.i18n.getMessage('popup_sessions_today', [count]);
```

**Time estimate:** 6-8 hours (mechanical replacement across all source files)

#### Step 4: Add data-i18n Attributes to HTML Elements

For static HTML content, add `data-i18n` attributes instead of calling `chrome.i18n.getMessage()` in JavaScript.

```html
<!-- Before -->
<h2>General</h2>
<label>Language</label>
<button>Save</button>

<!-- After -->
<h2 data-i18n="options_nav_general"></h2>
<label data-i18n="options_general_language"></label>
<button data-i18n="common_save"></button>
```

**Attribute localization:**
```html
<!-- Input placeholders -->
<input data-i18n-placeholder="options_blocklist_add_placeholder" />

<!-- Tooltips -->
<button data-i18n-title="popup_btn_settings">⚙</button>

<!-- Accessibility -->
<div data-i18n-aria="popup_focus_score_label" role="status"></div>
```

**Time estimate:** 3-4 hours (HTML modification across popup, options, onboarding, block page)

#### Step 5: Initialize I18nManager in Each Page

Add I18nManager initialization to each HTML page's entry point.

```javascript
// Add to each page's main JS file
import { I18nManager } from '../shared/i18n-manager.js';
import { RTLManager } from '../shared/rtl-manager.js';

document.addEventListener('DOMContentLoaded', () => {
  // Localize static HTML content
  const i18n = new I18nManager();
  i18n.localizeDocument();

  // Apply RTL if needed
  const rtl = new RTLManager();
  rtl.apply();
});
```

Pages requiring initialization:
1. `popup.html` / `popup.js`
2. `options.html` / `options.js`
3. `onboarding.html` / `onboarding.js`
4. Block page (content script — uses I18nManager with shadow root)

**Time estimate:** 1-2 hours

#### Step 6: Test with Pseudo-locale

Before submitting for real translation, test with a pseudo-locale that reveals i18n issues.

**Pseudo-locale technique:**
Create `_locales/qps/messages.json` where every string is wrapped with markers:

```json
{
  "popup_btn_start_focus": {
    "message": "[\u00A7\u0160\u0163\u00E4\u0155\u0163 \u0191\u00F6\u00E7\u00FC\u0161]",
    "description": "Pseudo-localized: Start Focus"
  }
}
```

**What pseudo-locale testing reveals:**
- **Untranslated strings:** Any English text in the UI is a string that was missed during migration
- **Truncation:** Pseudo strings are ~40% longer, revealing layout overflow issues
- **Concatenation bugs:** If pseudo strings appear broken or partially English, the string was incorrectly concatenated
- **Placeholder errors:** If `$1$` or `$PLACEHOLDER$` appears literally, the substitution is broken
- **RTL readiness:** Using a pseudo-RTL locale tests direction flipping

**Time estimate:** 2-3 hours (create pseudo-locale + fix identified issues)

#### Step 7: Submit for Translation

With the validated en/messages.json, submit to translators or a translation service (DeepL API for initial drafts, human review for final quality).

**Submission package per locale:**
1. `en/messages.json` — source strings
2. Context screenshots — UI screenshots showing where each string appears
3. Style guide — tone, register, brand terms, max character lengths
4. Glossary — key terms and their approved translations

**Time estimate:** 1 day per locale (initial machine translation + human review)

### 7.2 Estimated Effort Summary

| Step | Task | Time Estimate |
|------|------|---------------|
| 1 | String extraction script | 2-4 hours |
| 2 | Create en/messages.json | 4-6 hours |
| 3 | Replace hardcoded strings in JS | 6-8 hours |
| 4 | Add data-i18n to HTML | 3-4 hours |
| 5 | Initialize I18nManager | 1-2 hours |
| 6 | Pseudo-locale testing + fixes | 2-3 hours |
| 7 | Submit for translation | 1 day/locale |
| **Total** | **Initial migration** | **2-3 days** |
| **Total** | **Each additional locale** | **1 day** |

### 7.3 Locale File Structure

After migration, the directory structure:

```
_locales/
├── en/
│   └── messages.json          ← Master (500+ entries)
├── es/
│   └── messages.json          ← Spanish (this document)
├── de/
│   └── messages.json          ← German (this document)
├── ja/
│   └── messages.json          ← Japanese (this document)
├── fr/
│   └── messages.json          ← French (this document)
├── pt_BR/
│   └── messages.json          ← Brazilian Portuguese (this document)
├── ko/
│   └── messages.json          ← Korean (P2)
├── zh_CN/
│   └── messages.json          ← Simplified Chinese (P2)
├── it/
│   └── messages.json          ← Italian (P2)
├── ar/
│   └── messages.json          ← Arabic (P3, RTL)
├── he/
│   └── messages.json          ← Hebrew (P3, RTL)
└── qps/
    └── messages.json          ← Pseudo-locale (testing only)
```

### 7.4 Validation Checklist

Before each locale goes live:

- [ ] All 500+ keys present in locale file (no missing keys)
- [ ] All placeholders preserved correctly ($1$, $PLACEHOLDER$)
- [ ] Brand terms NOT translated (Focus Mode, Focus Score, Nuclear Mode, Zovo, Pro)
- [ ] JSON valid (parseable, no trailing commas, no syntax errors)
- [ ] String length within UI constraints (no overflow in popup, options, block page)
- [ ] Motivational quotes culturally appropriate for target market
- [ ] Date/time/number formatting tested with LocaleFormatter
- [ ] Pseudo-locale test passed (no untranslated strings visible)
- [ ] RTL layout correct (if applicable)
- [ ] Screenshots reviewed by native speaker

---

## Cross-Reference to Other Agents

| Topic | Agent | Document |
|-------|-------|----------|
| Master en/messages.json key list (500+ entries) | Agent 1 | `agent1-architecture-patterns.md` |
| I18nManager full specification | Agent 1 | `agent1-architecture-patterns.md` |
| String extraction script | Agent 2 | `agent2-translation-rtl.md` |
| DeepL/Crowdin translation pipeline | Agent 2 | `agent2-translation-rtl.md` |
| RTL CSS migration details | Agent 2 | `agent2-translation-rtl.md` |
| Date/time/number Intl formatting | Agent 3 | `agent3-locale-features-store.md` |
| PPP pricing per region | Agent 3 | `agent3-locale-features-store.md` |
| CWS store descriptions per locale | Agent 3 | `agent3-locale-features-store.md` |
| Pseudo-localization testing details | Agent 4 | `agent4-testing-priority.md` |
| Visual regression testing | Agent 4 | `agent4-testing-priority.md` |
| Market priority analysis | Agent 4 | `agent4-testing-priority.md` |

---

*Agent 5 — Sample Translations & Integration Architecture — Complete*
