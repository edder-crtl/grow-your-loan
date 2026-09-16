CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  ocupacion TEXT NOT NULL DEFAULT '',
  ingresos_mensuales NUMERIC NOT NULL DEFAULT 0,
  gastos_fijos NUMERIC NOT NULL DEFAULT 0,
  deuda_actual NUMERIC NOT NULL DEFAULT 0,
  antiguedad_laboral_meses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perfil propio" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.productos_financieros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  tipo_tasa TEXT NOT NULL DEFAULT 'fija',
  tasa_mensual NUMERIC NOT NULL,
  tasa_mora_mensual NUMERIC NOT NULL DEFAULT 0.025,
  plazo_min INTEGER NOT NULL DEFAULT 6,
  plazo_max INTEGER NOT NULL DEFAULT 72,
  monto_min NUMERIC NOT NULL,
  monto_max NUMERIC NOT NULL,
  comision_apertura_pct NUMERIC NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.productos_financieros TO anon;
GRANT SELECT ON public.productos_financieros TO authenticated;
GRANT ALL ON public.productos_financieros TO service_role;
ALTER TABLE public.productos_financieros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalogo publico" ON public.productos_financieros FOR SELECT TO anon, authenticated USING (activo);

CREATE TABLE public.solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos_financieros ON DELETE SET NULL,
  producto_nombre TEXT NOT NULL DEFAULT '',
  monto NUMERIC NOT NULL,
  plazo_meses INTEGER NOT NULL,
  tasa_mensual NUMERIC NOT NULL,
  cuota_mensual NUMERIC NOT NULL,
  total_pagar NUMERIC NOT NULL,
  total_intereses NUMERIC NOT NULL,
  comision_apertura NUMERIC NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Borrador',
  fecha_desembolso DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitudes TO authenticated;
GRANT ALL ON public.solicitudes TO service_role;
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solicitudes propias" ON public.solicitudes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.amortizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  numero_cuota INTEGER NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  cuota NUMERIC NOT NULL,
  capital NUMERIC NOT NULL,
  interes NUMERIC NOT NULL,
  saldo NUMERIC NOT NULL,
  pagada BOOLEAN NOT NULL DEFAULT false,
  fecha_pago DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_amortizaciones_solicitud ON public.amortizaciones (solicitud_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.amortizaciones TO authenticated;
GRANT ALL ON public.amortizaciones TO service_role;
ALTER TABLE public.amortizaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amortizaciones propias" ON public.amortizaciones FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nombre', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.productos_financieros (nombre, descripcion, tipo_tasa, tasa_mensual, tasa_mora_mensual, plazo_min, plazo_max, monto_min, monto_max, comision_apertura_pct) VALUES
('Capital de Trabajo PyME', 'Liquidez para inventario y nómina de negocios con más de 6 meses de operación.', 'fija', 0.0185, 0.028, 6, 36, 1000000, 50000000, 0.02),
('Crédito Libre Inversión', 'Financiación abierta para proyectos, remodelación o consolidación de deudas.', 'fija', 0.0215, 0.030, 12, 72, 2000000, 80000000, 0.025),
('Microcrédito Emprendedor', 'Montos pequeños y plazos cortos para negocios de barrio y comercio informal.', 'fija', 0.0295, 0.035, 6, 24, 300000, 8000000, 0.03),
('Compra de Cartera', 'Refinanciación de obligaciones vigentes con una sola cuota mensual.', 'variable', 0.0160, 0.026, 12, 60, 3000000, 120000000, 0.015),
('Crédito Vehículo Productivo', 'Adquisición de moto, camioneta o vehículo de trabajo con plazos largos.', 'fija', 0.0145, 0.024, 24, 72, 8000000, 150000000, 0.018);