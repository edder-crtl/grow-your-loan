# Plan: CuentaClara para personas del común

## Qué cambiaré
- Simplificar el lenguaje del simulador para explicar cuota, intereses, capacidad de pago y resultado sin términos técnicos innecesarios.
- Añadir recomendaciones automáticas dentro de cada simulación según la carga de la cuota, el dinero disponible, el costo del crédito y la viabilidad.
- Crear una sección de **Consejos** con hábitos prácticos sobre presupuesto, ahorro, deudas, fondo de emergencia y comparación de créditos.
- Incluir la nueva sección en el menú lateral de computador y en la navegación inferior de celular, manteniendo la adaptación actual a cada pantalla.

## Comportamiento
- Las recomendaciones cambiarán al modificar monto, plazo, ingresos, gastos o deudas.
- Se distinguirán acciones positivas, precauciones y alertas con texto claro y breve.
- Las recomendaciones serán orientación educativa y aclararán que no constituyen aprobación del crédito.

## Base de datos
- No crearé otra base de datos: la aplicación ya está conectada a Lovable Cloud.
- Mantendré el catálogo de productos, perfiles, solicitudes y tablas de cuotas existentes.
- Al finalizar explicaré, en lenguaje sencillo, qué se guarda, cuándo se guarda y cómo revisar esa información desde **View Backend**.

## Verificación
- Revisar la pantalla principal y Consejos en computador y celular.
- Confirmar que no haya desbordamientos, pantallas en blanco ni errores.
