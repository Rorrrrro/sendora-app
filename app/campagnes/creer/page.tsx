"use client";
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Pencil, X, CheckCircle2, Circle, Check, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppLayout } from "@/components/dashboard-layout";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useUser } from "@/contexts/user-context";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { createBrowserClient } from '@/lib/supabase';

export default function CreateCampaignPage() {
  const [campaignName, setCampaignName] = useState('');
  const [editingName, setEditingName] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [senderValidated, setSenderValidated] = useState(false);
  const [recipientsValidated, setRecipientsValidated] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const [expediteurs, setExpediteurs] = useState<{ id: string; email: string; nom: string; statut_domaine?: string }[]>([]);
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderDomaineStatus, setSenderDomaineStatus] = useState<string | undefined>(undefined);
  const [quotaMensuel, setQuotaMensuel] = useState<number>(0);
  const [mailsEnvoyesCeMois, setMailsEnvoyesCeMois] = useState<number>(0);
  const [userLists, setUserLists] = useState<{ id: string; nom: string; nb_contacts: number }[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [totalDestinataires, setTotalDestinataires] = useState<number>(0);
  const [contactsByList, setContactsByList] = useState<{ [listId: string]: { id: string; email: string }[] }>({});

  // Fonction pour détecter les emails génériques
  const isGenericEmail = (email: string) => {
    const genericDomains = [
      'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.fr', 'ymail.com',
      'outlook.com', 'hotmail.com', 'hotmail.fr', 'live.com', 'msn.com',
      'aol.com', 'protonmail.com', 'icloud.com', 'me.com', 'mac.com',
      'gmx.com', 'gmx.fr', 'orange.fr', 'wanadoo.fr', 'sfr.fr', 'free.fr',
      'laposte.net'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return genericDomains.includes(domain);
  };

  // Récupérer les expéditeurs vérifiés de la famille
  useEffect(() => {
    const fetchExpediteurs = async () => {
      if (!user) return;
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('Expediteurs')
        .select('id, email, nom, statut, statut_domaine')
        .eq('statut', 'Vérifié')
        .order('email', { ascending: true });
      if (!error && data) {
        setExpediteurs(data);
      }
    };
    fetchExpediteurs();
  }, [user]);

  // Mettre à jour les valeurs quand les expéditeurs sont chargés ou changent
  useEffect(() => {
    if (expediteurs.length > 0) {
      setSenderEmail(expediteurs[0].email);
      setSenderName(expediteurs[0].nom || '');
      setSenderDomaineStatus(expediteurs[0].statut_domaine);
    } else {
      setSenderEmail('');
      setSenderName('');
      setSenderDomaineStatus(undefined);
    }
  }, [expediteurs]);

  // Quand on change d'email expéditeur, mettre à jour le nom et le statut_domaine associés
  const handleSenderEmailChange = (email: string) => {
    setSenderEmail(email);
    const exp = expediteurs.find(e => e.email === email);
    setSenderName(exp?.nom || '');
    setSenderDomaineStatus(exp?.statut_domaine);
  };

  // Récupérer le quota et le nombre d'emails envoyés ce mois pour l'utilisateur
  useEffect(() => {
    const fetchQuota = async () => {
      if (!user) return;
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('Utilisateurs')
        .select('quota_mensuel, mails_envoyes_ce_mois')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setQuotaMensuel(data.quota_mensuel || 0);
        setMailsEnvoyesCeMois(data.mails_envoyes_ce_mois || 0);
      }
    };
    fetchQuota();
  }, [user]);

  // Récupérer les listes de l'utilisateur
  useEffect(() => {
    if (!user) return;
    const supabase = createBrowserClient();
    supabase
      .from('Listes')
      .select('id, nom, nb_contacts')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setUserLists(data);
      });
  }, [user]);

  // Récupérer les contacts de chaque liste sélectionnée
  useEffect(() => {
    if (!userLists.length) return;
    const supabase = createBrowserClient();
    const fetchContacts = async () => {
      const contactsMap: { [listId: string]: { id: string; email: string }[] } = {};
      for (const list of userLists) {
        const { data, error } = await supabase
          .from('Listes_Contacts')
          .select('contact_id, Contacts(email)')
          .eq('liste_id', list.id);
        if (!error && data) {
          contactsMap[list.id] = data.map((row: any) => ({ id: row.contact_id, email: row.Contacts?.email }));
        }
      }
      setContactsByList(contactsMap);
    };
    fetchContacts();
  }, [userLists]);

  // Calculer le total de destinataires uniques sélectionnés
  useEffect(() => {
    const emailsSet = new Set<string>();
    selectedListIds.forEach(listId => {
      (contactsByList[listId] || []).forEach(contact => {
        if (contact.email) emailsSet.add(contact.email);
      });
    });
    setTotalDestinataires(emailsSet.size);
  }, [selectedListIds, contactsByList]);

  const handleSectionClick = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F9FAFB]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-8">
              <div className="flex-1">
                {editingName ? (
                  <div className="relative">
                    <Input
                      value={campaignName}
                      onChange={e => setCampaignName(e.target.value)}
                      onBlur={() => campaignName.trim() && setEditingName(false)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && campaignName.trim()) {
                          setEditingName(false);
                        }
                      }}
                      placeholder="Donnez un nom à votre campagne"
                      autoFocus
                      className="text-2xl font-bold bg-transparent border-none shadow-none px-0 focus:ring-0 focus-visible:ring-0"
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold text-[#111827] flex items-center gap-2">
                      {campaignName}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingName(true)}
                        className="ml-1"
                      >
                        <Pencil className="w-4 h-4 text-[#6c43e0]" />
                      </Button>
                      <span className="ml-2 px-2 py-0.5 bg-gray-200 text-xs rounded-full text-gray-600">Brouillon</span>
                    </h1>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fermer"
                onClick={() => router.push('/campagnes')}
                className="rounded-full w-8 h-8 hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </Button>
            </div>

            {/* Bloc principal */}
            <div className="space-y-4 relative">
              {/* Expéditeur */}
              <div className="relative z-20">
                <div 
                  className={`rounded-2xl border transition-all overflow-hidden
                    ${expandedSection === 'sender' 
                      ? 'bg-white border-[#6C43E0] relative z-20 transform scale-105' 
                      : 'bg-[#FAFAFD] border-[#E0E1E1] hover:bg-[#f4f4fd] hover:border-[#6C43E0]'
                    }
                    ${expandedSection && expandedSection !== 'sender' ? 'opacity-50' : ''}
                  `}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {senderValidated ? (
                        <CheckCircle2 className="w-5 h-5 text-[#6c43e0]" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300" />
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-[#111827]">Expéditeur</h3>
                          {!senderValidated && (
                          <p className="text-sm text-gray-500">L'adresse qui enverra la campagne.</p>
                          )}
                          {senderValidated && (
                            <div className="flex items-center gap-2 text-base">
                              <span className="font-semibold text-[#3d247a]">{senderName}</span>
                            <span className="text-gray-400">•</span>
                              <span className="text-gray-600">{senderEmail}</span>
                          </div>
                          )}
                        </div>
                      </div>
                      {!expandedSection && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleSectionClick('sender')}
                          className="mt-4 md:mt-0 border-[#e0e0e0] bg-[#fffeff] text-[#23272f] hover:bg-[#fafbfc] hover:border-[#bdbdbd] whitespace-nowrap"
                        >
                          {senderValidated ? 'Modifier l\'expéditeur' : 'Gérer l\'expéditeur'}
                        </Button>
                      )}
                    </div>
                    {expandedSection === 'sender' && (
                      <div className="flex flex-col md:flex-row gap-12">
                      <div className="flex-1 min-w-[380px] max-w-lg">
                        <div className="space-y-6 mt-8">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                              <label className="text-lg font-semibold text-[#2d1863]">Adresse email</label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button type="button" className="text-gray-400 hover:text-gray-600 focus:outline-none">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                                </PopoverTrigger>
                                <PopoverContent side="right" align="start" className="max-w-[320px] text-sm rounded-lg shadow-lg p-5 bg-white border border-gray-200">
                                  Adresse utilisée comme expéditeur visible par vos destinataires.
                                </PopoverContent>
                              </Popover>
                          </div>
                            <Select value={senderEmail} onValueChange={handleSenderEmailChange}>
                              <SelectTrigger className="w-full max-w-lg border-[#e0e0e0]">
                              <SelectValue placeholder="Sélectionner une adresse" />
                            </SelectTrigger>
                            <SelectContent>
                              {expediteurs.length === 0 && (
                                <div className="px-4 py-2 text-muted-foreground text-sm">Aucun expéditeur vérifié</div>
                              )}
                              {expediteurs.map((exp) => (
                                <SelectItem key={exp.id} value={exp.email}>
                                  {exp.email} {exp.nom ? <span className="text-xs text-gray-400 ml-2">({exp.nom})</span> : null}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                              <label className="text-lg font-semibold text-[#2d1863]">Nom</label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button type="button" className="text-gray-400 hover:text-gray-600 focus:outline-none">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                                </PopoverTrigger>
                                <PopoverContent side="right" align="start" className="max-w-[320px] text-sm rounded-lg shadow-lg p-5 bg-white border border-gray-200">
                                  Nom affiché comme expéditeur dans la boîte de réception.
                                </PopoverContent>
                              </Popover>
                            </div>
                            <Input
                              value={senderName}
                              onChange={(e) => setSenderName(e.target.value)}
                              className="w-full max-w-lg border-[#e0e0e0]"
                            />
                        </div>

                        {/* Alerte domaine non authentifié ou email générique */}
                        {senderDomaineStatus !== 'Authentifié' && senderEmail && (
                          <div className="flex items-center gap-4 bg-[#f4f3fd] border border-[#e5e1fa] rounded-lg px-4 py-3 mb-6 max-w-lg">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#6c43e0] bg-opacity-10 -ml-2">
                              <svg width="36" height="36" fill="none" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15" fill="#6c43e0" fillOpacity="0.18"/>
                                <path d="M18 11v10" stroke="#6c43e0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="18" cy="26" r="2" fill="#6c43e0"/>
                              </svg>
                            </span>
                            <div className="flex-1 pl-0">
                              <div className="font-bold text-base text-[#2d1863] mb-1">
                                {isGenericEmail(senderEmail) 
                                  ? "Email générique détecté" 
                                  : "Votre domaine n'est pas authentifié"
                                }
                              </div>
                              <div className="text-sm text-[#3d247a]">
                                {isGenericEmail(senderEmail) ? (
                                  <>
                                    Les emails personnels (gmail, outlook, etc.) ne peuvent pas être authentifiés.
                                    <br /><span className="block mt-2"></span>
                                    Pour garantir la distribution, vos emails seront envoyés via <span className="font-semibold">campagnes@sendora.fr</span>
                                  </>
                                ) : (
                                  <>
                                    Pour envoyer des emails avec votre adresse, vous devez <a href="#" className="underline text-[#6c43e0] hover:text-[#4f32a7]">authentifier votre domaine</a>.
                                    <br /><span className="block mt-2"></span>
                                    Sinon, vos emails seront envoyés via <span className="font-semibold">campagnes@sendora.fr</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-center gap-3 mt-8">
                        <Button 
                          variant="outline" 
                          onClick={() => setExpandedSection(null)}
                          className="border-[#e0e0e0] bg-[#fffeff] text-[#23272f] hover:bg-[#fafbfc] hover:border-[#bdbdbd]"
                        >
                          Annuler
                        </Button>
                        <Button 
                            onClick={() => {
                              setSenderValidated(true);
                              setExpandedSection(null);
                            }}
                          className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white"
                        >
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                    </div>
                    <div className="hidden md:flex w-full justify-end items-start pr-16">
                      <div className="flex flex-col items-center gap-6" style={{minWidth: 320}}>
                        <div className="relative flex items-center justify-center" style={{width: 320, height: 600}}>
                          {/* Contour iPhone */}
                          <div className="absolute inset-0 rounded-[2.5rem] border-[10px] border-[#e0e0e0] shadow-xl bg-gradient-to-br from-[#f7f7f9] to-[#eeeef0] z-0"></div>
                          {/* Barre noire fine en haut */}
                          {/* <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-black rounded-full z-20"></div> */}
                          {/* Boutons latéraux */}
                          {/* Volume haut */}
                          <div className="absolute left-[-2px] top-[120px] w-2 h-8 bg-[#d1d5db] rounded-full z-20"></div>
                          {/* Volume bas */}
                          <div className="absolute left-[-2px] top-[160px] w-2 h-8 bg-[#d1d5db] rounded-full z-20"></div>
                          {/* Mute */}
                          <div className="absolute left-[-1px] top-[90px] w-1.5 h-5 bg-[#b5b8ba] rounded-full z-20"></div>
                          {/* Power */}
                          <div className="absolute right-[-2px] top-[110px] w-2 h-16 bg-[#d1d5db] rounded-full z-20"></div>
                          {/* Encoche découpée dans le fond, même dégradé que le fond du téléphone, barre w-10, encoche plus haute */}
                          <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[160px] h-9 bg-gradient-to-br from-[#f7f7f9] to-[#eeeef0] z-30 rounded-b-3xl flex items-center justify-center">
                            <div className="flex flex-row items-center justify-center gap-1.5 mx-auto">
                              <div className="w-10 h-2 bg-[#cfd2d6] rounded-full"></div>
                              <div className="w-2.5 h-2.5 bg-[#cfd2d6] rounded-full"></div>
                            </div>
                          </div>
                          {/* Ecran */}
                          <div className="relative w-[276px] h-[560px] bg-white rounded-[2rem] overflow-hidden z-10 flex flex-col shadow-lg">
                            {/* Barre de statut */}
                            <div className="flex items-center justify-between px-4 pt-3 pb-1 text-[13px] text-gray-400 font-medium">
                              <span>09:38</span>
                              <div className="flex items-center justify-end w-full gap-1 -mr-1">
                                {/* Wifi */}
                                <svg width="20" height="12" viewBox="0 0 16 10" fill="none">
                                  <path d="M8 8.5c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9zm-2-2c1.1-1.1 2.9-1.1 4 0 .2.2.5.2.7 0 .2-.2.2-.5 0-.7-1.5-1.5-3.9-1.5-5.4 0-.2.2-.2.5 0 .7.2.2.5.2.7 0zm-2-2c2.2-2.2 5.8-2.2 8 0 .2.2.5.2.7 0 .2-.2.2-.5 0-.7-2.6-2.6-6.8-2.6-9.4 0-.2.2-.2.5 0 .7.2.2.5.2.7 0z" fill="#a3a6ab"/>
                                </svg>
                                {/* Batterie */}
                                <svg width="20" height="10" viewBox="0 0 16 8" fill="none">
                                  <rect x="1" y="1" width="11" height="6" rx="1.2" fill="none" stroke="#a3a6ab" strokeWidth="1"/>
                                  <rect x="13" y="3" width="1.5" height="2" rx="0.75" fill="#a3a6ab"/>
                                </svg>
                              </div>
                            </div>
                            {/* Inbox mail */}
                            <div className="px-4 py-2 border-b border-gray-200 text-center font-bold text-gray-800 text-lg">Boîte de réception</div>
                            {/* Premier mail (actif) */}
                            <div className="px-4 py-2 border-b border-gray-100">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#2d1863] text-base">{senderName || 'Sendora'}</span>
                                <span className="font-bold text-gray-700 text-base w-14 text-center font-poppins">09:38</span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-[15px]">Objet du message...</div>
                                <div className="text-gray-500 text-xs">Votre texte d'aperçu</div>
                              </div>
                            </div>
                            <div className="border-b border-gray-100" />
                            {/* Mails suivants (gris, barres) */}
                            {['08:41','07:12','06:03'].map((hour, i) => (
                              <div key={i} className="px-4 py-2 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-gray-300 text-base">{senderName || 'Sendora'}</span>
                                  <span className="font-bold text-gray-300 text-base w-14 text-center font-poppins">{hour}</span>
                                </div>
                                <div className="flex flex-col gap-1 mt-1">
                                  <div className="h-2 w-2/3 bg-gray-100 rounded-full"></div>
                                  <div className="h-2 w-1/2 bg-gray-100 rounded-full"></div>
                                </div>
                              </div>
                            ))}
                            <div className="flex-1"></div>
                            <div className="text-center text-sm text-gray-400 pb-4 pt-2">Aperçu du rendu sur mobile</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Destinataires */}
              <div className={`transition-opacity duration-200 ${expandedSection === 'sender' ? 'opacity-50' : ''}`}>
                <Section
                  title="Destinataires"
                  description="Les personnes qui recevront votre campagne."
                  buttonLabel="Ajouter des destinataires"
                />
              </div>
              {/* Objet */}
              <div className={`transition-opacity duration-200 ${expandedSection === 'sender' ? 'opacity-50' : ''}`}>
                <Section
                  title="Objet"
                  description="Ajoutez un objet à votre campagne."
                  buttonLabel="Ajouter un objet"
                />
              </div>
              {/* Design */}
              <div className={`transition-opacity duration-200 ${expandedSection === 'sender' ? 'opacity-50' : ''}`}>
                <Section
                  title="Design"
                  description="Créez le contenu de votre email."
                  buttonLabel="Commencer le design"
                />
              </div>
              {/* Paramètres additionnels */}
              <div className={`transition-opacity duration-200 ${expandedSection === 'sender' ? 'opacity-50' : ''}`}>
                <Section
                  title="Paramètres additionnels"
                  description="Options avancées de la campagne."
                  buttonLabel="Modifier les paramètres"
                  hideCheck
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8">
              <Button variant="outline" className="border-[#e0e0e0] bg-[#fffeff] text-[#23272f] hover:bg-[#fafbfc] hover:border-[#bdbdbd]">
                Prévisualiser & Tester
              </Button>
              <Button className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white">
                Programmer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Section réutilisable
function Section({ title, description, buttonLabel, checked, hideCheck, dimmed, onClick }: any) {
  return (
    <div className={`relative z-20 rounded-2xl border px-8 py-6 transition-all bg-[#FAFAFD] border-[#E0E1E1] hover:bg-[#f4f4fd] hover:border-[#6C43E0] ${dimmed ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!hideCheck && (
            checked ? (
              <CheckCircle2 className="w-5 h-5 text-[#6c43e0]" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300" />
            )
          )}
          <div>
            <h3 className="text-xl font-bold text-[#111827]">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={onClick}
          className="mt-4 md:mt-0 border-[#e0e0e0] bg-[#fffeff] text-[#23272f] hover:bg-[#fafbfc] hover:border-[#bdbdbd] whitespace-nowrap px-6 py-3 text-base font-semibold rounded-xl"
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}