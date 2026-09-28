# Credito Inteligente Colombia

Actúa como un diseñador senior experto en desarrollo de aplicaciones web

en Colombia, especializado en productos para pequeños negocios. Propuesta:

El motor de cálculo y simulador financiero/credito es una aplicación web transaccional diseñada para evaluar la viabilidad de un préstamo o inversión en tiempo real. A diferencia de una calculadora web común que solo resuelve una ecuación simple, esta plataforma almacena datos de usuarios, productos financieros e historial de solicitudes, para luego ejecutar un procesamiento lógico complejo antes de emitir un resultado o tomar una decisión automatizada. 





Procesamiento que realiza:

Categorización de cartera por edades (cartera corriente, 30, 60, 90+ días).

Cálculo de intereses de mora y recargos según normativas o configuraciones personalizadas.

Generador automático de planes de refinanciación ajustando cuotas según la capacidad de pago del usuario.

Flujos de notificación automática (reprogramación de mensajes según el estado del compromiso).




Datos necesarios:

Para funcionar correctamente, la aplicación requiere una base de datos relacional organizada en cuatro ejes principales:

Usuarios y Perfiles Financieros: Guarda la información del solicitante, incluyendo sus ingresos mensuales, gastos fijos, historial de endeudamiento, ocupación y antigüedad laboral.

Catálogo de Productos Financieros: Almacena las reglas de los préstamos disponibles (tasas de interés fijas o variables, plazos permitidos de 6 a 72 meses, montos mínimos/máximos y porcentajes de comisión por apertura).

Expedientes de Solicitudes: Mantiene el registro de cada simulación realizada, con sus fechas, estados (En Borrador, Aprobada, Rechazada, En Revisión) y la opción seleccionada por el usuario.

Tablas de Amortización Generadas: Guarda el desglose detallado cuota por cuota de las simulaciones aprobadas o guardadas por el usuario.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://grow-your-loan.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ab8e9d27-c6e6-4973-a49c-2b2176021151).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
