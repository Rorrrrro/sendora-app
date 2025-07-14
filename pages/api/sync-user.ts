import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }
  const { email, password, prenom, nom } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email ou mot de passe manquant" });
  }
  // 1. Upsert dans Utilisateurs (seulement email, prenom, nom)
  const { error: upsertError } = await supabase
    .from("Utilisateurs")
    .upsert({ email, prenom, nom }, { onConflict: "email" });
  if (upsertError) {
    return res.status(500).json({ error: upsertError.message });
  }
  // 2. Vérifie si l'utilisateur existe déjà dans auth.users
  const { data: existingUser, error: selectError } = await supabase
    .from("auth.users")
    .select("id")
    .eq("email", email)
    .single();
  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116 = no rows found, donc pas une vraie erreur
    return res.status(500).json({ error: selectError.message });
  }
  if (existingUser) {
    // L'utilisateur existe déjà dans auth.users
    return res.status(200).json({ alreadyExists: true });
  }
  // 3. Crée dans auth.users si besoin (avec mot de passe)
  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { prenom, nom },
    email_confirm: true,
  });
  if (createError) {
    if (!createError.message.includes("already registered")) {
      return res.status(500).json({ error: createError.message });
    }
  }
  return res.status(200).json({ success: true });
} 