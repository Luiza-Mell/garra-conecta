
-- Create a trigger function to handle new user setup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
  _name text;
  _org_name text;
  _cnpj text;
  _company text;
BEGIN
  _role := NEW.raw_user_meta_data->>'role';
  _name := NEW.raw_user_meta_data->>'full_name';
  _org_name := NEW.raw_user_meta_data->>'organization_name';
  _cnpj := NEW.raw_user_meta_data->>'cnpj';
  _company := NEW.raw_user_meta_data->>'company';

  -- Default to 'supporter' if no role specified
  IF _role IS NULL OR _role = '' THEN
    _role := 'supporter';
  END IF;

  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, _name);

  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role::user_role);

  -- Create organization or supporter record
  IF _role = 'organization' THEN
    INSERT INTO public.organizations (user_id, name, cnpj)
    VALUES (NEW.id, COALESCE(_org_name, 'Nova Organização'), _cnpj);
  ELSIF _role = 'supporter' THEN
    INSERT INTO public.supporters (user_id, name, company)
    VALUES (NEW.id, COALESCE(_name, 'Novo Apoiador'), _company);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
