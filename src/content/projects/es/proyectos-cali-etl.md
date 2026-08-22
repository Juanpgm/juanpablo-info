---
title: "Proyectos Cali ETL"
description: "Pipeline ETL en Python que carga y verifica los datos de proyectos de inversión de la Alcaldía de Cali hacia Firestore, con autenticación por Workload Identity Federation."
projectId: "proyectos-cali-etl"
pubDate: 2026-08-21
draft: false
---

## Resumen

La Alcaldía de Santiago de Cali gestiona un volumen considerable de datos sobre sus proyectos de inversión: presupuestos, avances, responsables y estado de ejecución. Para que esa información sea consultable y confiable, primero hay que llevarla desde su origen hasta un almacén operativo, validando en el camino que lo que se carga es lo que corresponde.

Proyectos Cali ETL es el pipeline que resuelve ese paso. Es un proceso de extracción, transformación y carga (ETL) escrito en Python que toma los datos de proyectos de inversión de la Alcaldía, los procesa y los deposita en Firestore, incluyendo una etapa de verificación de la carga. No es una aplicación de cara al usuario final: es la tubería de datos que alimenta lo que otras herramientas luego consultan.

El problema que ataca es el de la confianza en el dato cargado. Un ETL que solo escribe, sin comprobar, deja abierta la pregunta de si el destino refleja realmente el origen. Este proyecto trata la carga y su verificación como parte del mismo flujo, y se apoya en Workload Identity Federation de Google Cloud para autenticarse contra Firebase sin distribuir llaves de servicio de larga duración.

## Arquitectura

El proyecto se organiza como un pipeline sobre Python y cuadernos Jupyter, con Firestore como destino de los datos y Google Cloud gestionando la autenticación. La configuración de acceso a la base de datos vive en `database/config.py`, que sirve además como punto de verificación de que el entorno está correctamente conectado.

La autenticación no usa un archivo de credenciales estático, sino Workload Identity Federation, el mecanismo que Google Cloud recomienda para evitar el manejo de llaves de servicio. El proyecto está asociado al identificador de Firebase `calitrack-44403`, sobre el que se ejecuta la configuración específica del entorno.

La documentación del repositorio separa dos caminos de puesta en marcha: una guía completa de configuración de Firebase con Workload Identity Federation (que cubre la instalación de Google Cloud CLI en Windows, Linux y macOS, y los distintos entornos de desarrollo, staging y producción) y una guía de configuración rápida para levantar el entorno de desarrollo del proyecto en pocos minutos.

## Stack técnico

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **Python** | Lenguaje del pipeline ETL | Ecosistema maduro para manipulación de datos y clientes oficiales de Firebase y Google Cloud |
| **Jupyter** | Exploración y ejecución del proceso | Permite iterar sobre los pasos de extracción, transformación y verificación de forma interactiva, revisando resultados intermedios |
| **Firebase / Firestore** | Destino de los datos | Almacén operativo donde queda la información de proyectos ya procesada, disponible para su consulta |
| **Google Cloud** | Autenticación y plataforma | Workload Identity Federation como método de acceso seguro, sin llaves de servicio de larga duración |

## Instalación

El repositorio documenta dos rutas. Para la primera puesta en marcha, se sigue la guía de configuración de Firebase con Workload Identity Federation; para retomar un entorno ya conocido, la guía de configuración rápida cubre los comandos específicos del proyecto `calitrack-44403` y sus variables de entorno preconfiguradas.

Clonado del repositorio:

```bash
git clone https://github.com/Juanpgm/proyectos_cali_alcaldia_etl.git
cd proyectos_cali_alcaldia_etl
```

Para comprobar que la conexión a la base de datos quedó correctamente configurada, se ejecuta el script de configuración:

```bash
python database/config.py
```

Los detalles de instalación de Google Cloud CLI, la configuración de Workload Identity Federation por entorno y las variables preconfiguradas se encuentran en la carpeta `docs/` del repositorio.

## Decisiones de diseño

**Workload Identity Federation en vez de llaves de servicio.** En lugar de distribuir un archivo de credenciales estático — el atajo habitual para autenticar un servicio contra Firebase — el proyecto adopta el mecanismo que Google Cloud recomienda por seguridad. Una llave de servicio de larga duración es un secreto que hay que rotar, custodiar y que, filtrado, da acceso permanente; la federación de identidad evita ese riesgo emitiendo credenciales de corta vida. La contrapartida es una configuración inicial más elaborada, motivo por el que el repositorio dedica una guía completa a ese paso.

**Verificación como parte del ETL, no como paso aparte.** El proyecto no se limita a cargar datos hacia Firestore: incorpora la verificación de esa carga dentro del mismo flujo. Tratar la comprobación como parte del proceso, y no como una tarea manual posterior, es lo que permite confiar en que el destino refleja el origen.

**Cuadernos Jupyter para un proceso de datos iterativo.** Un ETL rara vez sale perfecto a la primera: hay que inspeccionar los datos de entrada, ajustar transformaciones y confirmar resultados. Jupyter encaja con esa naturaleza exploratoria, permitiendo revisar salidas intermedias sin reejecutar todo el pipeline en cada iteración.

## Aprendizajes

El proyecto muestra que un pipeline de datos serio no termina en el `INSERT`. Cargar información pública de una entidad gubernamental exige tanto cuidado en cómo se autentica el proceso — con federación de identidad en lugar de secretos estáticos — como en confirmar que lo cargado es correcto. Son decisiones que no agregan funcionalidad visible, pero que separan un ETL en el que se puede confiar de uno que solo mueve datos y espera lo mejor.
