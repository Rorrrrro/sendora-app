"use client";

import Link from "next/link"
import { ArrowRight, CheckCircle, BarChart3, Mail, Users, Zap } from "lucide-react"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import LogosCarousel from "@/components/LogosCarousel"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <img
                  src="/Sendora blanc.png"
                  alt="Sendora Logo"
                  className="max-h-10 md:max-h-12 lg:max-h-14 w-auto max-w-[100px] md:max-w-[120px] lg:max-w-[140px] object-contain transition-all"
                  style={{ display: 'block' }}
                />
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-white">
                Tarifs
              </a>
              <a href="#company" className="text-gray-300 hover:text-white">
                Entreprise
              </a>
              <a href="#resources" className="text-gray-300 hover:text-white">
                Ressources
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/connexion" className="px-4 py-2 rounded-full text-white hover:bg-[#FFFEFF]/10 transition-colors">
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="px-4 py-2 rounded-full bg-primary/90 text-white hover:bg-primary transition-colors"
              >
                S&apos;inscrire
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gray-900 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center bg-[#FFFEFF]/10 text-sm px-4 py-2 rounded-full mb-8">
            <span className="bg-primary/20 text-primary px-2 py-1 rounded-full mr-2">Nouveau</span>
            <span>Intégration avec l&apos;IA pour la génération de contenu</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto">
            Simplifiez votre marketing par email
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Créez, envoyez et analysez facilement vos campagnes email. Notre plateforme intuitive vous permet de
            communiquer efficacement avec votre audience et d&apos;augmenter vos conversions.
          </p>

          {/* Image animée */}
          <div className="relative mx-auto max-w-2xl mb-12">
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl p-4">
              <img src="/email-animate.svg" alt="Animation Email Sendora" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Logos Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-600 mb-8">Ils nous font confiance</p>
          <LogosCarousel />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-[#FFFEFF]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Une solution complète pour votre email marketing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Automatisez vos campagnes, personnalisez vos messages et analysez vos résultats pour optimiser votre
              stratégie marketing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Campagnes Personnalisées</h3>
              <p className="text-gray-600">
                Créez des emails personnalisés qui résonnent avec votre audience grâce à notre éditeur intuitif.
              </p>
            </div>

            <div className="p-6 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Segmentation Avancée</h3>
              <p className="text-gray-600">
                Ciblez précisément vos contacts en fonction de leur comportement et de leurs préférences.
              </p>
            </div>

            <div className="p-6 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyses Détaillées</h3>
              <p className="text-gray-600">
                Suivez les performances de vos campagnes en temps réel pour optimiser vos stratégies.
              </p>
            </div>

            <div className="p-6 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Automatisation</h3>
              <p className="text-gray-600">
                Programmez vos campagnes et créez des séquences automatisées pour gagner du temps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-16 md:py-24 bg-[#FFFEFF]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Des solutions adaptées à vos besoins</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-900 text-white p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-center">Pour les PME</h3>
              <p className="mb-8 text-center">
                Sendora aide les petites et moyennes entreprises à développer leur audience et à convertir plus de
                clients grâce à des campagnes email efficaces et abordables.
              </p>
              <a
                href="#pme"
                className="flex justify-center items-center bg-primary/20 text-primary hover:bg-primary/30 transition-colors py-2 px-4 rounded-md w-full"
              >
                PME <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>

            <div className="bg-gray-900 text-white p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-center">Pour les Grandes Entreprises</h3>
              <p className="mb-8 text-center">
                Sendora offre aux grandes entreprises des fonctionnalités avancées pour gérer des campagnes à grande
                échelle et communiquer efficacement avec des millions de contacts.
              </p>
              <a
                href="#enterprise"
                className="flex justify-center items-center bg-primary/20 text-primary hover:bg-primary/30 transition-colors py-2 px-4 rounded-md w-full"
              >
                Grandes Entreprises <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Pourquoi choisir Sendora ?</h2>

            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6">
                La meilleure solution pour simplifier votre marketing par email
              </h3>
              <p className="text-gray-700 mb-6">
                L&apos;automatisation des tâches répétitives vous permet de vous concentrer sur ce qui compte vraiment :
                développer votre entreprise. La plateforme intuitive de Sendora s&apos;adapte à vos besoins spécifiques,
                offrant des analyses en temps réel et une intégration transparente avec vos systèmes existants. Grâce à
                ses puissants outils, vous réduirez les erreurs et gagnerez un temps précieux, permettant à votre équipe
                de prendre des décisions basées sur des données fiables.
              </p>
              {/* Bouton 'Créer un compte' supprimé */}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-2">Création d&apos;emails assistée par IA</h4>
                  <p className="text-gray-600">
                    Générez automatiquement des contenus d&apos;emails engageants et personnalisés grâce à notre
                    technologie d&apos;IA avancée.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-2">Suivi en temps réel</h4>
                  <p className="text-gray-600">
                    Surveillez les performances de vos campagnes en direct avec des alertes et des mises à jour
                    instantanées.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-2">Multi-plateforme</h4>
                  <p className="text-gray-600">
                    Gérez vos campagnes depuis n&apos;importe où, sur n&apos;importe quel appareil, avec une interface
                    entièrement responsive.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-2">Tableaux de bord personnalisables</h4>
                  <p className="text-gray-600">
                    Configurez votre tableau de bord pour afficher les KPIs et métriques qui comptent le plus pour votre
                    activité.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Comment démarrer</h2>
            <h3 className="text-2xl font-bold mb-8">Questions fréquentes</h3>
            <p className="text-gray-600 mb-12">Trouvez les réponses aux questions fréquemment posées ici.</p>

            <Accordion type="single" collapsible className="space-y-6">
              <AccordionItem value="q1" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="flex justify-between items-center w-full p-4 text-left font-medium bg-white">
                  <span>Qu'est-ce que Sendora et comment ça fonctionne ?</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0 bg-white text-gray-700">
                  Sendora est une plateforme d'emailing simple et moderne, pensée pour les petites entreprises. Elle permet d'importer vos contacts, créer des campagnes email et suivre vos statistiques, le tout avec une interface claire et rapide.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="flex justify-between items-center w-full p-4 text-left font-medium bg-white">
                  <span>Ai-je besoin de compétences techniques pour utiliser Sendora ?</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0 bg-white text-gray-700">
                  Non, Sendora a été conçue pour être accessible à tous, sans compétences techniques particulières. L'interface est intuitive et vous guide pas à pas dans la création de vos campagnes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="flex justify-between items-center w-full p-4 text-left font-medium bg-white">
                  <span>Sendora peut-il gérer de grandes listes de contacts ?</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0 bg-white text-gray-700">
                  Oui, Sendora permet d'importer et de gérer facilement de grandes listes de contacts, que ce soit via un fichier ou manuellement. La plateforme est pensée pour la performance, même avec de nombreux contacts.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="flex justify-between items-center w-full p-4 text-left font-medium bg-white">
                  <span>Quel type de support Sendora offre-t-il en cas de besoin ?</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0 bg-white text-gray-700">
                  Notre équipe support est disponible pour vous accompagner en cas de besoin. Vous pouvez nous contacter directement via le formulaire de contact ou par email, et nous vous répondrons rapidement.
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-8 flex items-center justify-center">
              <div className="mr-4 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-600">
                Besoin d&apos;aide supplémentaire ?{" "}
                <a href="mailto:contact@sendora.fr" className="text-primary font-medium hover:underline">
                  Contactez-nous
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gray-100 rounded-t-[40px]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Configurez Sendora et transformez votre stratégie email dès aujourd&apos;hui
          </h2>
          <Link
            href="/inscription"
            className="inline-flex items-center bg-[#6c43e0] text-white py-3 px-8 rounded-full hover:bg-[#4f32a7] transition-colors font-semibold text-lg"
          >
            Commencer maintenant <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="mr-2 h-8 w-8 rounded bg-[#FFFEFF]/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">S</span>
                </div>
                <span className="text-xl font-bold">Sendora</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produits</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Pour les PME
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Pour les Grandes Entreprises
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Intégration IA
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Gestion des Contacts
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Témoignages clients
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Presse
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Carrières
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Ressources</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    FAQ
                  </a>
                </li>
                <li>
                  <Link href="/conditions" className="text-gray-400 hover:text-white">
                    Conditions générales
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialite" className="text-gray-400 hover:text-white">
                    Politique de confidentialité
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">© Sendora 2025</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">YouTube</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
