"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Pencil, X, CheckCircle2, Circle, Check, HelpCircle, Eye, Smartphone, Tablet, Monitor, Cloud, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppLayout } from "@/components/dashboard-layout";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from "@/contexts/user-context";
import { createBrowserClient } from "@/lib/supabase";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function CreateCampaignPage() {
  const [campaignName, setCampaignName] = useState('');
  const [editingName, setEditingName] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [senderValidated, setSenderValidated] = useState(false);
  const [recipientsValidated, setRecipientsValidated] = useState(false);
  const [objectValidated, setObjectValidated] = useState(false);
  const [contentValidated, setContentValidated] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const [expediteurs, setExpediteurs] = useState<{ id: string; email: string; nom: string; statut_domaine?: string }[]>([]);
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderDomaineStatus, setSenderDomaineStatus] = useState<string | undefined>(undefined);
  const [userLists, setUserLists] = useState<{ id: string; nom: string; nb_contacts: number }[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [totalDestinataires, setTotalDestinataires] = useState(0);
  const [quotaMensuel, setQuotaMensuel] = useState(0);
  const [mailsEnvoyesCeMois, setMailsEnvoyesCeMois] = useState(0);
  const [contactsByList, setContactsByList] = useState<{ [listId: string]: { id: string; email: string }[] }>({});
  const [subjectLine, setSubjectLine] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // États pour les paramètres additionnels
  const [useReplyToEmail, setUseReplyToEmail] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState('');
  const [useAttachment, setUseAttachment] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [useCustomUnsubscribePage, setUseCustomUnsubscribePage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination pour les templates
  const templatesPerPage = 8;
  const [currentTemplatePage, setCurrentTemplatePage] = useState(1);
  const totalTemplates = templates.length;
  const totalTemplatePages = Math.max(1, Math.ceil(totalTemplates / templatesPerPage));
  const paginatedTemplates = templates.slice(
    (currentTemplatePage - 1) * templatesPerPage,
    currentTemplatePage * templatesPerPage
  );

  // Aperçu modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  // Pour le scale de l'aperçu
  const PREVIEW_MAX_WIDTH = 320;
  const PREVIEW_CLOSED_HEIGHT = 180;
  const CARD_CLOSED_HEIGHT = 300;
  const CARD_CHROME_HEIGHT = CARD_CLOSED_HEIGHT - PREVIEW_CLOSED_HEIGHT;
  const [templateMeta, setTemplateMeta] = useState<Record<string, any>>({});
  const previewRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const roRef = useRef<ResizeObserver | null>(null);

  // ResizeObserver sur les containers de preview (pour recalculer le scale)
  useEffect(() => {
    if (roRef.current) roRef.current.disconnect();

    roRef.current = new ResizeObserver(() => {
      setTemplateMeta((prev) => ({ ...prev }));
    });

    paginatedTemplates.forEach((t) => {
      const pr = previewRefs.current[t.id];
      if (pr) roRef.current?.observe(pr);
    });

    return () => roRef.current?.disconnect();
  }, [paginatedTemplates]);

  const handleIframeLoad = (templateId: string) => {
    const iframe = iframeRefs.current[templateId];
    const previewEl = previewRefs.current[templateId];
    if (!iframe || !previewEl) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const naturalWidth =
        doc.documentElement.scrollWidth || doc.body?.scrollWidth || 600;
      const naturalHeight =
        doc.documentElement.scrollHeight || doc.body?.scrollHeight || 800;

      const previewWidth = previewEl.clientWidth || PREVIEW_MAX_WIDTH;
      const scale = naturalWidth > 0 ? previewWidth / naturalWidth : 1;

      setTemplateMeta((p) => ({
        ...p,
        [templateId]: { scale, naturalWidth, naturalHeight, previewWidth },
      }));
    } catch {
      const previewWidth = previewEl.clientWidth || PREVIEW_MAX_WIDTH;
      const naturalWidth = 600;
      const naturalHeight = 800;
      const scale = previewWidth / naturalWidth;

      setTemplateMeta((p) => ({
        ...p,
        [templateId]: { scale, naturalWidth, naturalHeight, previewWidth },
      }));
    }
  };

  // Aperçu modal
  const handlePreview = (template: any) => {
    setPreviewHtml(template.html_code || "");
    setPreviewTitle(template.nom || "");
    setPreviewOpen(true);
    setPreviewDevice("desktop"); // Ajout pour reset device à chaque ouverture
  };

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

  // Correction du typage pour familleId
  const familleId = user && user.compte_parent_id ? user.compte_parent_id : user?.id;

  // Récupérer les listes de la famille
  useEffect(() => {
    if (!familleId) return;
    const supabase = createBrowserClient();
    supabase
      .from('Listes')
      .select('id, nom, nb_contacts')
      .eq('famille_id', familleId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setUserLists(data);
      });
  }, [familleId]);

  // Récupérer le quota et le nombre d'emails envoyés ce mois pour la famille (parent ou user)
  useEffect(() => {
    if (!familleId) return;
    const supabase = createBrowserClient();
    const fetchQuota = async () => {
      const { data, error } = await supabase
        .from('Utilisateurs')
        .select('quota_mensuel, mails_envoyes_ce_mois')
        .eq('id', familleId)
        .single();
      if (!error && data) {
        setQuotaMensuel(data.quota_mensuel || 0);
        setMailsEnvoyesCeMois(data.mails_envoyes_ce_mois || 0);
      }
    };
    fetchQuota();
  }, [familleId]);

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
    // Mettre à jour l'email de réponse si l'option est activée
    if (useReplyToEmail && !replyToEmail) {
      setReplyToEmail(email);
    }
  };

  // Mettre à jour l'email de réponse quand l'option est activée
  useEffect(() => {
    if (useReplyToEmail && !replyToEmail && senderEmail) {
      setReplyToEmail(senderEmail);
    }
  }, [useReplyToEmail, senderEmail, replyToEmail]);

  // Handlers pour la gestion des fichiers
  const validateFiles = (newFiles: File[], existingFiles: File[] = []): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png', 'application/pdf', 'application/zip', 'application/x-zip-compressed'];
    const allowedExtensions = ['.jpeg', '.jpg', '.gif', '.png', '.pdf', '.zip'];
    const maxTotalSize = 10 * 1024 * 1024; // 10 Mo total

    // Vérifier le type de chaque nouveau fichier
    for (const file of newFiles) {
      const isValidType = allowedTypes.includes(file.type) || allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      if (!isValidType) {
        return `Type de fichier non autorisé pour "${file.name}". Formats acceptés : JPEG, JPG, GIF, PNG, PDF, ZIP`;
      }
    }

    // Vérifier la taille totale
    const existingSize = existingFiles.reduce((total, file) => total + file.size, 0);
    const newSize = newFiles.reduce((total, file) => total + file.size, 0);
    const totalSize = existingSize + newSize;

    if (totalSize > maxTotalSize) {
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1);
      return `Taille totale dépassée (${totalSizeMB} Mo). Limite globale : 10 Mo`;
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const error = validateFiles(selectedFiles, attachmentFiles);
      if (error) {
        setAttachmentError(error);
      } else {
        setAttachmentError(null);
        setAttachmentFiles(prev => [...prev, ...selectedFiles]);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const error = validateFiles(droppedFiles, attachmentFiles);
      if (error) {
        setAttachmentError(error);
      } else {
        setAttachmentError(null);
        setAttachmentFiles(prev => [...prev, ...droppedFiles]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeAttachment = () => {
    setAttachmentFiles([]);
    setAttachmentError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeIndividualFile = (indexToRemove: number) => {
    setAttachmentFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setAttachmentError(null);
  };

  const handleSectionClick = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

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

  // Calcul du quota restant
  const emailsRestants = Math.max(0, quotaMensuel - mailsEnvoyesCeMois - totalDestinataires);
  const quotaDisponible = Math.max(0, quotaMensuel - mailsEnvoyesCeMois);
  const progress = quotaDisponible > 0 ? Math.min(100, (totalDestinataires / quotaDisponible) * 100) : 0;

  // Récupère les templates de la famille de l'utilisateur
  useEffect(() => {
    async function fetchTemplates() {
      if (!user) return;
      const supabase = createBrowserClient();
      let familleId = user?.compte_parent_id || user?.id;
      const { data, error } = await supabase
        .from("Templates")
        .select("*")
        .eq("famille_id", familleId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setTemplates(data);
      }
      setLoadingTemplates(false);
    }
    fetchTemplates();
  }, [user]);

  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("desktop");

  // Helper pour le z-index dynamique des sections
  const sectionZ = (id: string) =>
    expandedSection === id ? "z-50" : expandedSection ? "z-10" : "z-20";

  return (
    <AppLayout>
      {/* Dialog preview GLOBAL : doit être monté même quand la box "Contenu" est fermée */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl w-full h-[90vh] p-0 flex flex-col [&>button]:hidden">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">
                {previewTitle || "Aperçu du template"}
              </DialogTitle>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 ${previewDevice === "mobile" ? "bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]" : ""}`}
                  onClick={() => setPreviewDevice("mobile")}
                  aria-label="Mobile"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 ${previewDevice === "tablet" ? "bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]" : ""}`}
                  onClick={() => setPreviewDevice("tablet")}
                  aria-label="Tablet"
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 ${previewDevice === "desktop" ? "bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]" : ""}`}
                  onClick={() => setPreviewDevice("desktop")}
                  aria-label="Desktop"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPreviewOpen(false)}
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center">
            <div
              className={`bg-white border rounded-lg overflow-hidden mx-auto transition-all duration-300 ${
                previewDevice === "mobile"
                  ? "w-[375px] max-h-[90%] overflow-y-auto"
                  : previewDevice === "tablet"
                  ? "w-[768px] h-[900px] max-h-full"
                  : "w-[1200px] h-full max-h-[90%]"
              }`}
              style={{
                width: previewDevice === "mobile" ? 375 : previewDevice === "tablet" ? 768 : 1200,
                height: previewDevice === "mobile" ? "auto" : previewDevice === "tablet" ? 900 : "90%",
                minHeight: previewDevice === "mobile" ? "667px" : "auto",
                border: "none",
                background: "#fff",
                boxShadow: "0 1px 4px #e0e0e0",
                display: "block",
              }}
            >
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  style={{
                    width: "100%",
                    height: previewDevice === "mobile" ? "auto" : "100%",
                    minHeight: previewDevice === "mobile" ? "667px" : "auto",
                    border: "none",
                    background: "#fff",
                  }}
                  title={`Aperçu ${previewTitle}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Pas de contenu HTML à afficher
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
            <div className="space-y-5 relative">
              {/* Expéditeur */}
              <div className={`relative ${sectionZ("sender")}`}>
                <div 
                  className={`rounded-2xl border transition-all overflow-hidden
                    ${expandedSection === 'sender' 
                      ? 'bg-white border-[#6C43E0] relative z-20 transform scale-105 my-4' 
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
                          className="mt-4 md:mt-0 border-[#e0e0e0] bg-[#fffeff] text-[#23272f] hover:bg-[#fafbfc] hover:border-[#bdbdbd] whitespace-nowrap px-6 py-3 text-base font-semibold rounded-xl"
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
                    )}
                  </div>
                </div>
              </div>

              {/* Destinataires */}
              <div className={`relative ${sectionZ("recipients")}`}>
                <div 
                  className={`rounded-2xl border transition-all overflow-hidden
                    ${expandedSection === 'recipients' 
                      ? 'bg-white border-[#6C43E0] relative z-20 transform scale-105 my-4' 
                      : 'bg-[#FAFAFD] border-[#E0E1E1] hover:bg-[#f4f4fd] hover:border-[#6C43E0]'
                    }
                    ${expandedSection && expandedSection !== 'recipients' ? 'opacity-50' : ''}
                  `}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {recipientsValidated ? (
                          <CheckCircle2 className="w-5 h-5 text-[#6c43e0]" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300" />
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-[#111827]">Destinataires</h3>
                          {recipientsValidated ? (
                            <div className="flex items-center gap-2 text-base">
                              <span className="font-semibold text-[#3d247a]">{totalDestinataires} destinataire{totalDestinataires > 1 ? 's' : ''}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">{emailsRestants} emails restants</span>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Les personnes qui recevront votre campagne.</p>
                          )}
                        </div>
                      </div>
                      {/* Masquer le bouton Modifier les destinataires si la box est ouverte en mode édition */}
                      {!expandedSection && (
                        <Button 
                        variant="outline" 
                        onClick={() => handleSectionClick('recipients')}
                        className="mt-4 md:mt-0 border-[#e0e0e0] bg-[#fffeff] text-[#23272f] hover:bg-[#fafbfc] hover:border-[#bdbdbd] whitespace-nowrap px-6 py-3 text-base font-semibold rounded-xl"
                      >
                        {recipientsValidated ? 'Modifier les destinataires' : 'Ajouter des destinataires'}
                      </Button>
                      )}
                    </div>
                    {expandedSection === 'recipients' && (
                      <div className="flex flex-col items-center gap-4 mt-6 min-w-[420px] max-w-2xl mx-auto py-4">
                        <div className="flex items-center gap-2 mb-4 w-full">
                          <label className="text-xl font-semibold text-[#2d1863]">Sélectionner une ou plusieurs listes</label>
                        </div>
                        <div className="space-y-1.5 w-full max-h-80 overflow-y-auto px-1">
                          {userLists.map(list => (
                            <label 
                              key={list.id} 
                              className={`flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 cursor-pointer w-full shadow-sm transition-all duration-200
                                ${selectedListIds.includes(list.id) 
                                  ? 'bg-[#f4f3fd] hover:bg-[#eeebfc]' 
                                  : 'bg-white hover:bg-[#f5f5f5]'
                                }
                              `}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedListIds.includes(list.id)}
                                  onChange={() => {
                                    setSelectedListIds(prev =>
                                      prev.includes(list.id)
                                        ? prev.filter(id => id !== list.id)
                                        : [...prev, list.id]
                                    );
                                  }}
                                  className="accent-[#6c43e0] w-[18px] h-[18px] rounded-sm cursor-pointer focus:ring-[#6c43e0] focus:ring-offset-0"
                                />
                                <span className="font-medium text-[#2d1863] text-base ml-1">{list.nom}</span>
                              </div>
                              <span className="text-gray-500 text-base">{list.nb_contacts} contact{list.nb_contacts > 1 ? 's' : ''}</span>
                            </label>
                          ))}
                        </div>
                        {/* Barre de progression du quota */}
                        <div className="mt-4 w-full">
                          <div className="flex justify-between items-center mb-1 w-full">
                            <span className="text-base text-gray-600">{totalDestinataires} destinataire{totalDestinataires > 1 ? 's' : ''} sélectionné{totalDestinataires > 1 ? 's' : ''}</span>
                            <span className="text-base font-semibold text-[#6c43e0]">{emailsRestants} emails restants</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-2 rounded-full transition-all duration-300 bg-[#6c43e0]"
                              style={{ width: `${quotaDisponible === 0 ? 100 : Math.min(100, (totalDestinataires / quotaDisponible) * 100)}%` }}
                            ></div>
                          </div>
                          {emailsRestants < 0 && totalDestinataires > 0 && (
                            <div className="text-gray-600 text-base mt-2 text-center">Attention : le nombre de destinataires dépasse votre quota mensuel.</div>
                          )}
                        </div>
                        <div className="flex justify-center gap-3 mt-8 w-full">
                          <Button 
                            variant="outline" 
                            onClick={() => setExpandedSection(null)}
                            className="border-[#e0e0e0] bg-[#fffeff] text-[#23272f] hover:bg-[#fafbfc] hover:border-[#bdbdbd] w-40"
                          >
                            Annuler
                          </Button>
                          <Button 
                            className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white w-40"
                            disabled={totalDestinataires === 0}
                            onClick={() => {
                              setRecipientsValidated(true);
                              setExpandedSection(null);
                            }}
                          >
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Objet */}
              <div className={`relative ${sectionZ("object")}`}>
                <div 
                  className={`rounded-2xl border transition-all overflow-hidden
                    ${expandedSection === 'object' 
                      ? 'bg-white border-[#6C43E0] relative z-20 transform scale-105 my-4' 
                      : 'bg-[#FAFAFD] border-[#E0E1E1] hover:bg-[#f4f4fd] hover:border-[#6C43E0]'
                    }
                    ${expandedSection && expandedSection !== 'object' ? 'opacity-50' : ''}
                  `}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {objectValidated ? (
                          <CheckCircle2 className="w-5 h-5 text-[#6c43e0]" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300" />
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-[#111827]">Objet</h3>
                          {!objectValidated && (
                            <p className="text-sm text-gray-500">Ajoutez un objet à votre campagne.</p>
                          )}
                          {objectValidated && (
                            <div className="flex flex-col gap-1">
                              <div className="text-base">
                                <span className="font-semibold text-[#3d247a]">Objet de la campagne :</span> <span className="text-gray-500">{subjectLine}</span>
                              </div>
                              <div className="text-base">
                                <span className="font-semibold text-[#3d247a]">Aperçu :</span> <span className="text-gray-500">{previewText}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {!expandedSection && (  
                        <Button 
                          variant="outline" 
                          onClick={() => handleSectionClick('object')}
                          className="mt-4 md:mt-0 border-[#e0e0e0] bg-[#fffeff] text-[#23272f] hover:bg-[#fafbfc] hover:border-[#bdbdbd] whitespace-nowrap px-6 py-3 text-base font-semibold rounded-xl"
                        >
                          {objectValidated ? 'Modifier l\'objet' : 'Ajouter un objet'}
                        </Button>
                      )}
                    </div>
                    {expandedSection === 'object' && (
                      <div className="flex flex-col md:flex-row gap-12">
                        <div className="flex-1 min-w-[380px] max-w-lg">
                          <div className="space-y-6 mt-8">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <label className="text-lg font-semibold text-[#2d1863]">Objet de l'email</label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button type="button" className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                      <HelpCircle className="w-4 h-4" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent side="right" align="start" className="max-w-[320px] text-sm rounded-lg shadow-lg p-5 bg-white border border-gray-200">
                                    L'objet est la première chose que verront vos destinataires. Faites-le court et percutant pour augmenter vos taux d'ouverture.
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <Input
                                value={subjectLine}
                                onChange={(e) => setSubjectLine(e.target.value)}
                                placeholder="Exemple: Découvrez notre nouvelle collection"
                                className="w-full max-w-lg border-[#e0e0e0]"
                              />
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <label className="text-lg font-semibold text-[#2d1863]">Texte d'aperçu</label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button type="button" className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                      <HelpCircle className="w-4 h-4" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent side="right" align="start" className="max-w-[320px] text-sm rounded-lg shadow-lg p-5 bg-white border border-gray-200">
                                    Ce texte apparaît sous l'objet dans la boîte de réception et donne un avant-goût du contenu de l'email.
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <Input
                                value={previewText}
                                onChange={(e) => setPreviewText(e.target.value)}
                                placeholder="Exemple: Profitez de 15% de réduction sur votre première commande"
                                className="w-full max-w-lg border-[#e0e0e0]"
                              />
                            </div>

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
                                  setObjectValidated(!!subjectLine);
                                  setExpandedSection(null);
                                }}
                                disabled={!subjectLine}
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
                              {/* Boutons latéraux */}
                              {/* Volume haut */}
                              <div className="absolute left-[-2px] top-[120px] w-2 h-8 bg-[#d1d5db] rounded-full z-20"></div>
                              {/* Volume bas */}
                              <div className="absolute left-[-2px] top-[160px] w-2 h-8 bg-[#d1d5db] rounded-full z-20"></div>
                              {/* Mute */}
                              <div className="absolute left-[-1px] top-[90px] w-1.5 h-5 bg-[#b5b8ba] rounded-full z-20"></div>
                              {/* Power */}
                              <div className="absolute right-[-2px] top-[110px] w-2 h-16 bg-[#d1d5db] rounded-full z-20"></div>
                              {/* Encoche découpée dans le fond */}
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
                                    <div className="font-semibold text-gray-900 text-[15px]">{subjectLine || 'Objet du message...'}</div>
                                    <div className="text-gray-500 text-xs">{previewText || 'Votre texte d\'aperçu'}</div>
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
                    )}
                  </div>
                </div>
              </div>

              {/* Design -> Contenu */}
              <div className={`relative ${sectionZ("design")}`} style={{ overflow: "visible" }}>
                <div 
                  className={`rounded-2xl border transition-all
                    ${expandedSection === 'design' 
                      ? 'bg-white border-[#6C43E0] relative z-20 transform scale-105 my-4 min-h-[500px]' 
                      : 'bg-[#FAFAFD] border-[#E0E1E1] hover:bg-[#f4f4fd] hover:border-[#6C43E0]'
                    }
                    ${expandedSection && expandedSection !== 'design' ? 'opacity-50' : ''}
                  `}
                  style={{
                    transition: 'min-height 0.3s cubic-bezier(.4,0,.2,1)',
                    minHeight: expandedSection === 'design' ? 500 : undefined,
                    overflow: "visible",
                  }}
                >
                  <div className="p-6" style={{overflow: "visible"}}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {contentValidated ? (
                          <CheckCircle2 className="w-5 h-5 text-[#6c43e0]" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300" />
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-[#111827]">Contenu</h3>
                          {selectedTemplateId ? (
                            <div className="flex items-center gap-2 text-base">
                              <span className="font-semibold text-[#3d247a]">Template sélectionné :</span>
                              <span className="text-gray-500">
                                {templates.find(t => t.id === selectedTemplateId)?.nom || ""}
                              </span>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="flex items-center justify-center rounded-full w-7 h-7 text-muted-foreground hover:text-[#6c43e0] hover:bg-[#f4f4fd]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const tpl = templates.find(t => t.id === selectedTemplateId);
                                  if (tpl) handlePreview(tpl);
                                }}
                                title="Aperçu du template sélectionné"
                                aria-label="Aperçu du template sélectionné"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Le message que vous allez envoyer.</p>
                          )}
                        </div>
                      </div>
                      {!expandedSection && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleSectionClick('design')}
                          className="mt-4 md:mt-0 border-[#e0e0e0] bg-[#fffeff] text-[#23272f] hover:bg-[#fafbfc] hover:border-[#bdbdbd] whitespace-nowrap px-6 py-3 text-base font-semibold rounded-xl"
                        >
                          {selectedTemplateId ? 'Modifier le contenu' : 'Choisir un modèle'}
                        </Button>
                      )}
                    </div>
                    {expandedSection === 'design' && (
                      <>
                        {/* Aperçu modal type /templates */}
                        {/* SUPPRIMER le <Dialog> ici, il n'est plus nécessaire */}
                        {/* Grille des templates avec bouton "Choisir" en overlay */}
                        <div
                          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full mt-6"
                          style={{ overflow: "visible", position: "relative" }}
                        >
                          {paginatedTemplates.map((template, idx) => {
                            const meta = templateMeta[template.id];
                            const scale = meta?.scale ?? 1;
                            const naturalHeight = meta?.naturalHeight ?? 700;
                            const previewHeight = Math.ceil(naturalHeight * scale);
                            const cardHeight = previewHeight + CARD_CHROME_HEIGHT;
                            return (
                              <div key={template.id} className="relative group" style={{marginTop: idx < 4 ? 12 : 0}}>
                                <div
                                  style={{ height: CARD_CLOSED_HEIGHT, position: "relative" }}
                                  onMouseEnter={e => {
                                    e.currentTarget.classList.add('force-hover');
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.classList.remove('force-hover');
                                  }}
                                >
                                  <div
                                    className="template-card absolute inset-0 bg-white border border-[#E0E1E1] rounded-2xl shadow-sm cursor-pointer flex flex-col items-center px-0 pt-3 pb-6 transition-all"
                                    style={{
                                      height: CARD_CLOSED_HEIGHT,
                                      ["--previewHeight" as any]: `${previewHeight}px`,
                                      ["--cardHeight" as any]: `${cardHeight}px`,
                                    } as React.CSSProperties}
                                    onClick={() => setSelectedTemplateId(template.id)}
                                  >
                                    <div className="w-full px-4 mb-1 flex items-center justify-between">
                                      <div className="font-semibold text-base truncate">{template.nom}</div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="flex items-center justify-center rounded-full w-8 h-8 text-muted-foreground hover:text-[#6c43e0] hover:bg-[#f4f4fd]"
                                        onClick={e => {
                                          e.stopPropagation();
                                          handlePreview(template);
                                        }}
                                        style={{ display: "inline-flex", flex: "0 0 auto" }}
                                        title="Aperçu"
                                        aria-label="Aperçu"
                                      >
                                        <Eye className="w-6 h-6" />
                                      </Button>
                                    </div>
                                    <div className="w-full flex justify-center items-start px-4">
                                      <div
                                        ref={(el) => {
                                          previewRefs.current[template.id] = el;
                                        }}
                                        className="template-preview bg-white rounded-xl border border-[#ececf6] shadow overflow-hidden"
                                        style={{
                                          width: "100%",
                                          maxWidth: PREVIEW_MAX_WIDTH,
                                          height: PREVIEW_CLOSED_HEIGHT,
                                          overflow: "hidden", // Ajout pour forcer la hauteur fermée
                                        }}
                                      >
                                        <div
                                          className="template-preview-inner"
                                          style={{
                                            width: meta?.naturalWidth ? `${meta.naturalWidth}px` : "600px",
                                            height: meta?.naturalHeight ? `${meta.naturalHeight}px` : "800px",
                                            transform: `scale(${scale})`,
                                            transformOrigin: "top left",
                                          }}
                                        >
                                          <iframe
                                            ref={(el) => {
                                              iframeRefs.current[template.id] = el;
                                            }}
                                            title={`preview-${template.id}`}
                                            srcDoc={template.html_code}
                                            onLoad={() => handleIframeLoad(template.id)}
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              border: "0",
                                              display: "block",
                                              background: "white",
                                              pointerEvents: "none",
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    {/* Zone bouton fixe */}
                                    <div
                                      className="w-full mt-auto px-4 pt-4 z-10"
                                      style={{ pointerEvents: "auto" }}
                                      onMouseEnter={e => {
                                        e.currentTarget.parentElement?.parentElement?.classList.remove('force-hover');
                                      }}
                                    >
                                      <Button
                                        className={`w-full ${selectedTemplateId === template.id ? 'bg-[#6c43e0] hover:bg-[#4f32a7] text-white border-[#6c43e0]' : ''}`}
                                        variant={selectedTemplateId === template.id ? "default" : "outline"}
                                        onClick={e => {
                                          e.stopPropagation();
                                          setSelectedTemplateId(template.id);
                                        }}
                                        style={selectedTemplateId === template.id ? {backgroundColor: '#6c43e0', borderColor: '#6c43e0', color: '#fff'} : {}}
                                      >
                                        {selectedTemplateId === template.id ? "Sélectionné" : "Choisir"}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <style jsx>{`
                                  .template-card {
                                    transition: height 300ms ease, transform 200ms ease, box-shadow 200ms ease;
                                    z-index: 10;
                                    overflow-y: hidden;
                                    display: flex;
                                    flex-direction: column;
                                    background: #fff !important;
                                  }
                                  .group:hover .template-card,
                                  .force-hover .template-card {
                                    height: var(--cardHeight) !important;
                                    z-index: 100 !important;
                                    transform: translateY(-6px);
                                    box-shadow: 0 12px 40px rgba(0,0,0,0.18);
                                    overflow-y: auto !important;
                                    max-height: 80vh !important;
                                    display: flex;
                                    flex-direction: column;
                                    background: #fff !important;
                                    border: 1px solid #E0E1E1 !important;
                                  }
                                  .group:hover .template-preview,
                                  .force-hover .template-preview {
                                    height: var(--previewHeight) !important;
                                    max-width: none !important;
                                    width: 100% !important;
                                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
                                  }
                                  .template-preview {
                                    transition: height 300ms ease, max-width 200ms ease, box-shadow 200ms ease;
                                  }
                                  .template-card > .absolute {
                                    transition: bottom 0.2s;
                                  }
                                `}</style>
                              </div>
                            );
                          })}
                        </div>
                        {/* Pagination */}
                        {totalTemplatePages > 1 && (
                          <div className="flex items-center gap-4 justify-end text-sm mt-6">
                            <span>
                              {paginatedTemplates.length === 0
                                ? "0"
                                : `${(currentTemplatePage - 1) * templatesPerPage + 1}-${Math.min(currentTemplatePage * templatesPerPage, totalTemplates)} sur ${totalTemplates}`}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-[#f4f4fd]"
                              onClick={() => setCurrentTemplatePage(p => Math.max(1, p - 1))}
                              disabled={currentTemplatePage === 1}
                              aria-label="Page précédente"
                            >
                              &lt;
                            </Button>
                            <span className="font-semibold">{currentTemplatePage}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-[#f4f4fd]"
                              onClick={() => setCurrentTemplatePage(p => Math.min(totalTemplatePages, p + 1))}
                              disabled={currentTemplatePage === totalTemplatePages}
                              aria-label="Page suivante"
                            >
                              &gt;
                            </Button>
                          </div>
                        )}
                        {/* Boutons Annuler / Enregistrer */}
                        <div className="flex justify-center gap-3 mt-8 w-full">
                          <Button 
                            variant="outline" 
                            onClick={() => setExpandedSection(null)}
                            className="border-[#e0e0e0] bg-[#fffeff] text-[#23272f] hover:bg-[#fafbfc] hover:border-[#bdbdbd] w-40"
                          >
                            Annuler
                          </Button>
                          <Button 
                            className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white w-40"
                            disabled={!selectedTemplateId}
                            onClick={() => {
                              setContentValidated(true);
                              setExpandedSection(null);
                            }}
                          >
                            Enregistrer
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Paramètres additionnels */}
              <div className={`relative ${sectionZ("params")}`}>
                <div 
                  className={`rounded-2xl border transition-all overflow-hidden
                    ${expandedSection === 'params' 
                      ? 'bg-white border-[#6C43E0] relative z-20 transform scale-105 my-4' 
                      : 'bg-[#FAFAFD] border-[#E0E1E1] hover:bg-[#f4f4fd] hover:border-[#6C43E0]'
                    }
                    ${expandedSection && expandedSection !== 'params' ? 'opacity-50' : ''}
                  `}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-[#111827]">Paramètres additionnels</h3>
                          <p className="text-sm text-gray-500">Options avancées de la campagne.</p>
                        </div>
                      </div>
                      {!expandedSection && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleSectionClick('params')}
                          className="mt-4 md:mt-0 border-[#e0e0e0] bg-[#fffeff] text-[#23272f] hover:bg-[#fafbfc] hover:border-[#bdbdbd] whitespace-nowrap px-6 py-3 text-base font-semibold rounded-xl"
                        >
                          Modifier les paramètres
                        </Button>
                      )}
                    </div>
                    {expandedSection === 'params' && (
                      <div className="mt-8">
                        <div className="space-y-8 max-w-2xl">
                          {/* Adresse de réponse différente */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id="reply-to-email"
                                checked={useReplyToEmail}
                                onCheckedChange={(checked) => {
                                  setUseReplyToEmail(Boolean(checked));
                                  if (!checked) {
                                    setReplyToEmail('');
                                  }
                                }}
                              />
                              <label 
                                htmlFor="reply-to-email" 
                                className="text-lg font-semibold text-[#2d1863] cursor-pointer"
                              >
                                Utiliser une adresse de réponse différente
                              </label>
                            </div>
                            {useReplyToEmail && (
                              <div className="ml-6">
                                <Input
                                  type="email"
                                  value={replyToEmail}
                                  onChange={(e) => setReplyToEmail(e.target.value)}
                                  placeholder="Entrez l'adresse de réponse"
                                  className="max-w-md"
                                />
                              </div>
                            )}
                          </div>

                          {/* Pièce jointe */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id="attachment"
                                checked={useAttachment}
                                onCheckedChange={(checked) => {
                                  setUseAttachment(Boolean(checked));
                                  if (!checked) {
                                    setAttachmentFiles([]);
                                    setAttachmentError(null);
                                    if (fileInputRef.current) {
                                      fileInputRef.current.value = '';
                                    }
                                  }
                                }}
                              />
                              <label 
                                htmlFor="attachment" 
                                className="text-lg font-semibold text-[#2d1863] cursor-pointer"
                              >
                                Ajouter une pièce jointe
                              </label>
                            </div>
                            {useAttachment && (
                              <div className="ml-6">
                                {/* Zone de drop toujours visible */}
                                <div
                                  className={`border-2 rounded-xl p-6 text-center transition-colors cursor-pointer bg-[#FFFEFF] flex flex-col items-center justify-center max-w-md mb-4
                                    ${attachmentError 
                                      ? 'border-red-500 bg-red-50' 
                                      : isDragActive 
                                        ? 'border-[#6c43e0] bg-[#f4f4fd]' 
                                        : 'border-[#bdbdbd] hover:border-[#6c43e0] hover:bg-[#fafbfc]'
                                    }`
                                  }
                                  onDrop={handleDrop}
                                  onDragOver={handleDragOver}
                                  onDragEnter={handleDragEnter}
                                  onDragLeave={handleDragLeave}
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Cloud className={`w-8 h-8 mb-2 ${attachmentError ? 'text-red-400' : 'text-gray-300'}`} />
                                  <p className={`text-sm font-light mb-1 ${
                                    attachmentError ? 'text-red-600' : 'text-[#23272f]'
                                  }`}>
                                    Ajouter des fichiers
                                  </p>
                                  <p className={`text-xs ${
                                    attachmentError ? 'text-red-500' : 'text-gray-500'
                                  }`}>
                                    JPEG, JPG, GIF, PNG, PDF, ZIP - Max 10 Mo total
                                  </p>
                                </div>
                                
                                {attachmentError && (
                                  <p className="text-red-500 text-sm mb-4 max-w-md">{attachmentError}</p>
                                )}

                                {/* Liste des fichiers sélectionnés */}
                                {attachmentFiles.length > 0 && (
                                  <div className="space-y-2 max-w-md">
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                      Fichiers sélectionnés ({attachmentFiles.length}) - 
                                      {(attachmentFiles.reduce((total, file) => total + file.size, 0) / (1024 * 1024)).toFixed(1)} Mo / 10 Mo
                                    </div>
                                    {attachmentFiles.map((file, index) => (
                                      <div key={`${file.name}-${index}`} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="font-medium text-green-900 text-sm truncate">{file.name}</p>
                                              <p className="text-xs text-green-700">
                                                {(file.size / (1024 * 1024)).toFixed(2)} Mo
                                              </p>
                                            </div>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeIndividualFile(index)}
                                            className="text-green-600 hover:text-green-800 hover:bg-green-100 w-6 h-6 flex-shrink-0"
                                          >
                                            <X className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  multiple
                                  onChange={handleFileChange}
                                  className="hidden"
                                  accept=".jpeg,.jpg,.gif,.png,.pdf,.zip"
                                />
                              </div>
                            )}
                          </div>

                          {/* Page de désinscription personnalisée */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id="custom-unsubscribe"
                                checked={useCustomUnsubscribePage}
                                onCheckedChange={(checked) => setUseCustomUnsubscribePage(Boolean(checked))}
                              />
                              <label 
                                htmlFor="custom-unsubscribe" 
                                className="text-lg font-semibold text-[#2d1863] cursor-pointer"
                              >
                                Utiliser une page de désinscription personnalisée
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Boutons Annuler / Enregistrer */}
                        <div className="flex justify-center gap-3 mt-12">
                          <Button 
                            variant="outline" 
                            onClick={() => setExpandedSection(null)}
                            className="border-[#e0e0e0] bg-[#fffeff] text-[#23272f] hover:bg-[#fafbfc] hover:border-[#bdbdbd] w-40"
                          >
                            Annuler
                          </Button>
                          <Button 
                            className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white w-40"
                            onClick={() => setExpandedSection(null)}
                          >
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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

