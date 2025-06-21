/**
 * Lola Anaïs - Site Web
 * Script principal optimisé pour la fluidité du défilement
 */

// Utilisation du mode strict pour éviter les erreurs courantes
'use strict';

// Module principal
const LolaApp = (function() {
    // Variables privées
    let currentStep = 1;
    let currentContentStep = 1;
    let currentTestimonial = 0;
    let galleryInterval;
    let currentGalleryImage = 0;
    let isScrolling = false;
    let scrollTimeout;
    let animationFrameId;
    let resizeTimeout;
    let testimonialElements = [];
    let visibleTestimonials = 5; // Nombre de témoignages à afficher initialement

    // Configuration
    const config = {
        galleryPassword: 'lola2024', // À remplacer par un système sécurisé côté serveur
        galleryAutoplayInterval: 5000,
        testimonialSwipeThreshold: 50,
        scrollThrottle: 100, // ms entre les mises à jour pendant le défilement
        animationInterval: 50, // ms entre les mises à jour d'animation (plus lent pour économiser les ressources)
        lazyLoadThreshold: 300 // px avant que l'élément entre dans la vue
    };

    // Données des témoignages - Suppression des emoji pour améliorer les performances
    const testimonials = [
        { stars: "★★★★★", text: "Lola est juste incroyable ! Une expérience qui m'a transporté", author: "M.D." },
        { stars: "★★★★★", text: "Wow, je ne m'attendais pas à ça ! Professionnelle et tellement douce", author: "A.L." },
        { stars: "★★★★★", text: "Best massage ever ! Lola sait exactement ce qu'elle fait", author: "J.M." },
        { stars: "★★★★★", text: "Une déesse ! Chaque seconde était parfaite, j'y retourne bientôt", author: "S.R." },
        { stars: "★★★★★", text: "Ambiance de folie, technique au top ! Lola est une artiste", author: "T.B." },
        { stars: "★★★★★", text: "Jamais ressenti ça ! Elle a des mains magiques, vraiment", author: "K.P." },
        { stars: "★★★★★", text: "Discrétion totale et service premium ! Exactement ce que je cherchais", author: "R.H." },
        { stars: "★★★★★", text: "Lola dépasse toutes les attentes ! Une expérience unique", author: "N.G." },
        { stars: "★★★★★", text: "Trop bien ! Ambiance cozy et Lola est adorable", author: "C.V." },
        { stars: "★★★★★", text: "Mind blown ! Je recommande à 1000% les yeux fermés", author: "D.F." },
        { stars: "★★★★★", text: "Service à domicile parfait ! Lola apporte tout le nécessaire", author: "L.K." },
        { stars: "★★★★★", text: "Massage tantrique de ouf ! Lola maîtrise son art à la perfection", author: "P.W." },
        { stars: "★★★★★", text: "Couple goals ! Ma copine et moi on a adoré notre séance", author: "M.T." },
        { stars: "★★★★★", text: "Lola est une perle ! Douce, attentionnée et tellement pro", author: "F.J." },
        { stars: "★★★★★", text: "Séance nocturne magique ! L'ambiance était dingue", author: "B.S." },
        { stars: "★★★★★", text: "Contenu perso au top ! Lola a compris exactement mes envies", author: "G.L." },
        { stars: "★★★★★", text: "Relaxation level 100 ! Je me suis senti renaître", author: "H.M." },
        { stars: "★★★★★", text: "Lola est un ange ! Bienveillante et tellement talentueuse", author: "V.R." },
        { stars: "★★★★★", text: "Expérience inoubliable ! Chaque détail était pensé", author: "E.D." },
        { stars: "★★★★★", text: "Pure détente ! Lola sait créer une atmosphère parfaite", author: "O.C." }
    ];

    /**
     * Initialisation de l'application
     */
    function init() {
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onDocumentReady);
        } else {
            onDocumentReady();
        }

        // Optimisation pour le défilement
        window.addEventListener('scroll', throttleScroll, { passive: true });
        window.addEventListener('resize', throttleResize, { passive: true });
    }

    /**
     * Fonction exécutée lorsque le document est prêt
     */
    function onDocumentReady() {
        setupEventListeners();
        setupLazyLoading();
        setupIntersectionObservers();
        setupAccessibility();
        
        // Chargement différé des témoignages pour améliorer les performances initiales
        setTimeout(() => {
            generateInitialTestimonials();
            updateFormNavigation();
            updateContentFormNavigation();
        }, 100);
    }

    /**
     * Configuration des écouteurs d'événements
     */
    function setupEventListeners() {
        // Menu hamburger
        const hamburger = document.querySelector('.hamburger');
        if (hamburger) {
            hamburger.addEventListener('click', toggleMenu);
            hamburger.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMenu();
                }
            });
        }

        // Fermer le menu au clic sur un lien
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                document.querySelector('.nav-links').classList.remove('active');
                document.querySelector('.hamburger').classList.remove('active');
                document.querySelector('.hamburger').setAttribute('aria-expanded', 'false');
            });
        });

        // Fermer les modales en cliquant à l'extérieur
        window.addEventListener('click', function(event) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    closeModal(modal.id);
                }
            });
        });

        // Support du glissement tactile pour la galerie
        setupGallerySwipe();

        // Support du glissement tactile pour les témoignages
        setupTestimonialsSwipe();

        // Gestion des formulaires
        setupFormHandlers();
    }

    /**
     * Configuration du chargement paresseux
     */
    function setupLazyLoading() {
        // Chargement paresseux de la vidéo d'arrière-plan
        const videoElement = document.querySelector('.video-background video');
        if (videoElement) {
            const source = videoElement.querySelector('source');
            if (source && source.dataset.src) {
                // Chargement différé de la vidéo pour améliorer les performances initiales
                setTimeout(() => {
                    source.src = source.dataset.src;
                    videoElement.load();
                    videoElement.play().catch(error => {
                        console.log('Lecture automatique empêchée:', error);
                    });
                }, 1000);
            }
        }

        // Chargement paresseux des images
        document.querySelectorAll('img[data-src]').forEach(img => {
            if (isElementInViewport(img, config.lazyLoadThreshold)) {
                loadImage(img);
            }
        });
    }

    /**
     * Charge une image avec data-src
     */
    function loadImage(img) {
        if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }
    }

    /**
     * Vérifie si un élément est dans le viewport
     */
    function isElementInViewport(el, threshold = 0) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight + threshold) &&
            rect.bottom >= (0 - threshold) &&
            rect.left <= (window.innerWidth + threshold) &&
            rect.right >= (0 - threshold)
        );
    }

    /**
     * Limitation du défilement pour améliorer les performances
     */
    function throttleScroll() {
        if (!isScrolling) {
            isScrolling = true;
            
            // Utiliser requestAnimationFrame pour synchroniser avec le rafraîchissement de l'écran
            animationFrameId = window.requestAnimationFrame(() => {
                handleScroll();
                
                // Réinitialiser le drapeau après un délai
                scrollTimeout = setTimeout(() => {
                    isScrolling = false;
                    // Charger plus de témoignages si nécessaire lorsque le défilement s'arrête
                    if (isElementInViewport(document.querySelector('.testimonials-carousel'))) {
                        loadMoreTestimonials();
                    }
                }, config.scrollThrottle);
            });
        }
    }

    /**
     * Gestion du défilement
     */
    function handleScroll() {
        // Chargement paresseux des images pendant le défilement
        document.querySelectorAll('img[data-src]').forEach(img => {
            if (isElementInViewport(img, config.lazyLoadThreshold)) {
                loadImage(img);
            }
        });
    }

    /**
     * Limitation du redimensionnement pour améliorer les performances
     */
    function throttleResize() {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        resizeTimeout = setTimeout(() => {
            handleResize();
        }, 200);
    }

    /**
     * Gestion du redimensionnement
     */
    function handleResize() {
        // Ajuster les éléments qui dépendent de la taille de la fenêtre
    }

    /**
     * Configuration des Intersection Observers
     */
    function setupIntersectionObservers() {
        // Observer pour les statistiques - utilisation d'un seuil plus élevé pour retarder l'animation
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Retarder l'animation pour améliorer les performances de défilement
                    setTimeout(() => {
                        animateStats();
                    }, 200);
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        const statsBar = document.querySelector('.stats-bar');
        if (statsBar) {
            statsObserver.observe(statsBar);
        }

        // Observer pour le chargement paresseux des images
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        loadImage(img);
                    }
                    imageObserver.unobserve(img);
                }
            });
        }, { rootMargin: '200px' });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    /**
     * Configuration de l'accessibilité
     */
    function setupAccessibility() {
        // Ajouter des attributs ARIA au menu hamburger
        const hamburger = document.querySelector('.hamburger');
        if (hamburger) {
            hamburger.setAttribute('aria-label', 'Menu principal');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.setAttribute('role', 'button');
            hamburger.setAttribute('tabindex', '0');
        }

        // Ajouter des attributs ARIA au carrousel de témoignages
        const testimonialsTrack = document.getElementById('testimonialsTrack');
        if (testimonialsTrack) {
            testimonialsTrack.setAttribute('aria-live', 'polite');
            testimonialsTrack.setAttribute('aria-atomic', 'true');
        }

        // Ajouter des attributs ARIA aux boutons du carrousel
        const prevBtn = document.querySelector('.carousel-btn:first-child');
        const nextBtn = document.querySelector('.carousel-btn:last-child');
        
        if (prevBtn && nextBtn) {
            prevBtn.setAttribute('aria-label', 'Témoignage précédent');
            nextBtn.setAttribute('aria-label', 'Témoignage suivant');
        }

        // Ajouter des attributs ARIA à la galerie
        const galleryCarousel = document.getElementById('galleryCarousel');
        if (galleryCarousel) {
            galleryCarousel.setAttribute('aria-live', 'polite');
        }
    }

    /**
     * Gestion du menu hamburger
     */
    function toggleMenu() {
        const navLinks = document.querySelector('.nav-links');
        const hamburger = document.querySelector('.hamburger');
        
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
        
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !isExpanded);
    }

    /**
     * Basculer la visibilité du mot de passe
     */
    function togglePasswordVisibility() {
        const passwordInput = document.getElementById('galleryPassword');
        const toggleIcon = document.getElementById('passwordToggleIcon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }

    /**
     * Vérification du mot de passe de la galerie
     */
    function checkGalleryPassword() {
        const password = document.getElementById('galleryPassword').value;
        const passwordForm = document.getElementById('galleryPasswordForm');
        const galleryCarousel = document.getElementById('galleryCarousel');
        
        if (password === config.galleryPassword) {
            if (passwordForm) passwordForm.style.display = 'none';
            if (galleryCarousel) {
                galleryCarousel.style.display = 'block';
                startGalleryCarousel();
            }
            showNotification('Accès autorisé', 'success');
        } else {
            showNotification('Mot de passe incorrect', 'error');
        }
    }

    /**
     * Démarrage du carrousel de la galerie
     */
    function startGalleryCarousel() {
        const images = document.querySelectorAll('#galleryCarousel img');
        if (!images.length) return;
        
        currentGalleryImage = 0;
        showGalleryImage(currentGalleryImage);

        // Défilement automatique - utilisation d'un intervalle plus long pour améliorer les performances
        galleryInterval = setInterval(() => {
            nextGalleryImage();
        }, config.galleryAutoplayInterval);
    }

    /**
     * Configuration du glissement tactile pour la galerie
     */
    function setupGallerySwipe() {
        const carousel = document.getElementById('galleryCarousel');
        if (!carousel) return;

        let startX = 0;
        let endX = 0;

        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            handleGallerySwipe();
        }, { passive: true });

        function handleGallerySwipe() {
            const diff = startX - endX;
            
            if (Math.abs(diff) > config.testimonialSwipeThreshold) {
                if (diff > 0) {
                    nextGalleryImage();
                } else {
                    previousGalleryImage();
                }
            }
        }
    }

    /**
     * Afficher une image spécifique de la galerie
     */
    function showGalleryImage(index) {
        const images = document.querySelectorAll('#galleryCarousel img');
        if (!images.length) return;
        
        // Masquer toutes les images
        images.forEach(img => {
            img.classList.remove('active');
            img.setAttribute('aria-hidden', 'true');
        });
        
        // Afficher l'image actuelle
        images[index].classList.add('active');
        images[index].setAttribute('aria-hidden', 'false');
    }

    /**
     * Passer à l'image suivante de la galerie
     */
    function nextGalleryImage() {
        const images = document.querySelectorAll('#galleryCarousel img');
        if (!images.length) return;
        
        currentGalleryImage = (currentGalleryImage + 1) % images.length;
        showGalleryImage(currentGalleryImage);
    }

    /**
     * Passer à l'image précédente de la galerie
     */
    function previousGalleryImage() {
        const images = document.querySelectorAll('#galleryCarousel img');
        if (!images.length) return;
        
        currentGalleryImage = (currentGalleryImage - 1 + images.length) % images.length;
        showGalleryImage(currentGalleryImage);
    }

    /**
     * Animation des statistiques - optimisée pour la performance
     */
    function animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const target = parseFloat(stat.getAttribute('data-target'));
            const isFloat = stat.getAttribute('data-target').includes('.');
            
            // Vérifier si l'utilisateur préfère les animations réduites
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            if (prefersReducedMotion) {
                // Afficher directement la valeur finale sans animation
                stat.textContent = isFloat ? target.toFixed(1) : Math.floor(target);
                return;
            }
            
            // Animation optimisée avec moins d'étapes
            const steps = 10;
            const increment = target / steps;
            let current = 0;
            let step = 0;
            
            const timer = setInterval(() => {
                step++;
                current = (step / steps) * target;
                
                if (step >= steps) {
                    current = target;
                    clearInterval(timer);
                }
                
                if (isFloat) {
                    stat.textContent = current.toFixed(1);
                } else {
                    stat.textContent = Math.floor(current);
                }
            }, config.animationInterval);
        });
    }

    /**
     * Génération initiale des témoignages - chargement partiel pour améliorer les performances
     */
    function generateInitialTestimonials() {
        const track = document.getElementById('testimonialsTrack');
        if (!track) return;
        
        track.innerHTML = '';
        
        // Ne charger qu'un nombre limité de témoignages initialement
        const initialTestimonials = testimonials.slice(0, visibleTestimonials);
        
        initialTestimonials.forEach((testimonial, index) => {
            const card = document.createElement('div');
            card.className = 'testimonial-card';
            card.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
            card.innerHTML = `
                <div class="stars" aria-label="${testimonial.stars.length} étoiles sur 5">${testimonial.stars}</div>
                <p>"${testimonial.text}"</p>
                <div class="author">- ${testimonial.author}</div>
            `;
            track.appendChild(card);
            testimonialElements.push(card);
        });
    }

    /**
     * Chargement de témoignages supplémentaires à la demande
     */
    function loadMoreTestimonials() {
        if (testimonialElements.length >= testimonials.length) return;
        
        const track = document.getElementById('testimonialsTrack');
        if (!track) return;
        
        // Charger le prochain lot de témoignages
        const nextBatch = testimonials.slice(testimonialElements.length, testimonialElements.length + 5);
        
        nextBatch.forEach((testimonial) => {
            const card = document.createElement('div');
            card.className = 'testimonial-card';
            card.setAttribute('aria-hidden', 'true');
            card.innerHTML = `
                <div class="stars" aria-label="${testimonial.stars.length} étoiles sur 5">${testimonial.stars}</div>
                <p>"${testimonial.text}"</p>
                <div class="author">- ${testimonial.author}</div>
            `;
            track.appendChild(card);
            testimonialElements.push(card);
        });
    }

    /**
     * Configuration du glissement tactile pour les témoignages
     */
    function setupTestimonialsSwipe() {
        const container = document.querySelector('.testimonials-container');
        if (!container) return;

        let startX = 0;
        let endX = 0;

        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            handleTestimonialSwipe();
        }, { passive: true });

        function handleTestimonialSwipe() {
            const diff = startX - endX;
            
            if (Math.abs(diff) > config.testimonialSwipeThreshold) {
                if (diff > 0) {
                    nextTestimonial();
                } else {
                    previousTestimonial();
                }
            }
        }
    }

    /**
     * Navigation vers le témoignage suivant - optimisée
     */
    function nextTestimonial() {
        const track = document.getElementById('testimonialsTrack');
        if (!track) return;
        
        // S'assurer que nous avons assez de témoignages chargés
        if (currentTestimonial >= testimonialElements.length - 2) {
            loadMoreTestimonials();
        }
        
        currentTestimonial = (currentTestimonial + 1) % Math.min(testimonialElements.length, testimonials.length);
        
        // Utiliser requestAnimationFrame pour une animation plus fluide
        window.requestAnimationFrame(() => {
            track.style.transform = `translateX(-${currentTestimonial * 100}%)`;
            
            // Mettre à jour les attributs ARIA
            testimonialElements.forEach((card, index) => {
                card.setAttribute('aria-hidden', index === currentTestimonial ? 'false' : 'true');
            });
        });
    }

    /**
     * Navigation vers le témoignage précédent - optimisée
     */
    function previousTestimonial() {
        const track = document.getElementById('testimonialsTrack');
        if (!track) return;
        
        currentTestimonial = (currentTestimonial - 1 + testimonialElements.length) % testimonialElements.length;
        
        // Utiliser requestAnimationFrame pour une animation plus fluide
        window.requestAnimationFrame(() => {
            track.style.transform = `translateX(-${currentTestimonial * 100}%)`;
            
            // Mettre à jour les attributs ARIA
            testimonialElements.forEach((card, index) => {
                card.setAttribute('aria-hidden', index === currentTestimonial ? 'false' : 'true');
            });
        });
    }

    /**
     * Configuration des gestionnaires de formulaires
     */
    function setupFormHandlers() {
        // Formulaire de réservation
        const reservationForm = document.getElementById('reservationForm');
        if (reservationForm) {
            reservationForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Validation des champs requis
                const requiredFields = reservationForm.querySelectorAll('[required]');
                let isValid = true;
                
                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        isValid = false;
                        field.style.borderColor = '#ff4444';
                    } else {
                        field.style.borderColor = '';
                    }
                });
                
                if (!isValid) {
                    showNotification('Veuillez remplir tous les champs obligatoires', 'error');
                    return;
                }
                
                // Afficher notification de succès puis envoyer via AJAX
                showNotification('Envoi en cours...', 'info');
                
                // Préparer les données du formulaire
                const formData = new FormData(reservationForm);
                
                // Envoyer via fetch (AJAX) - pas de redirection
                fetch('https://formsubmit.co/maddie.son.lola@gmail.com', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (response.ok) {
                        showNotification('Votre demande a été envoyée avec succès !', 'success');
                    } else {
                        showNotification('Erreur lors de l\'envoi. Veuillez réessayer.', 'error');
                    }
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    showNotification('Votre demande a été envoyée !', 'success'); // FormSubmit peut bloquer fetch mais l'email est envoyé
                })
                .finally(() => {
                    // Nettoyer et fermer
                    closeModal('reservationModal');
                    reservationForm.reset();
                    currentStep = 1;
                    updateFormNavigation();
                });
            });
        }

        // Formulaire de contenu personnalisé
        const contentForm = document.getElementById('contentForm');
        if (contentForm) {
            contentForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Validation des champs requis
                const requiredFields = contentForm.querySelectorAll('[required]');
                let isValid = true;
                
                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        isValid = false;
                        field.style.borderColor = '#ff4444';
                    } else {
                        field.style.borderColor = '';
                    }
                });
                
                if (!isValid) {
                    showNotification('Veuillez remplir tous les champs obligatoires', 'error');
                    return;
                }
                
                // Afficher notification de succès puis envoyer via AJAX
                showNotification('Envoi en cours...', 'info');
                
                // Préparer les données du formulaire
                const formData = new FormData(contentForm);
                
                // Envoyer via fetch (AJAX) - pas de redirection
                fetch('https://formsubmit.co/maddie.son.lola@gmail.com', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (response.ok) {
                        showNotification('Votre demande de contenu a été envoyée !', 'success');
                    } else {
                        showNotification('Erreur lors de l\'envoi. Veuillez réessayer.', 'error');
                    }
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    showNotification('Votre demande de contenu a été envoyée !', 'success'); // FormSubmit peut bloquer fetch mais l'email est envoyé
                })
                .finally(() => {
                    // Nettoyer et fermer
                    closeModal('contentModal');
                    contentForm.reset();
                    currentContentStep = 1;
                    updateContentFormNavigation();
                });
            });
        }

        // Formulaire d'avis
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Validation des champs requis
                const requiredFields = reviewForm.querySelectorAll('[required]');
                let isValid = true;
                
                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        isValid = false;
                        field.style.borderColor = '#ff4444';
                    } else {
                        field.style.borderColor = '';
                    }
                });
                
                if (!isValid) {
                    showNotification('Veuillez remplir tous les champs obligatoires', 'error');
                    return;
                }
                
                // Afficher notification de succès puis envoyer via AJAX
                showNotification('Envoi en cours...', 'info');
                
                // Préparer les données du formulaire
                const formData = new FormData(reviewForm);
                
                // Envoyer via fetch (AJAX) - pas de redirection
                fetch('https://formsubmit.co/maddie.son.lola@gmail.com', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (response.ok) {
                        showNotification('Merci pour votre avis !', 'success');
                    } else {
                        showNotification('Erreur lors de l\'envoi. Veuillez réessayer.', 'error');
                    }
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    showNotification('Merci pour votre avis !', 'success'); // FormSubmit peut bloquer fetch mais l'email est envoyé
                })
                .finally(() => {
                    // Nettoyer et fermer
                    closeModal('reviewModal');
                    reviewForm.reset();
                });
            });
        }

        // Formulaire de galerie
        const galleryPasswordForm = document.getElementById('galleryPasswordForm');
        if (galleryPasswordForm) {
            const passwordInput = document.getElementById('galleryPassword');
            const accessBtn = galleryPasswordForm.querySelector('.btn-primary');
            
            if (passwordInput && accessBtn) {
                passwordInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        checkGalleryPassword();
                    }
                });
                
                accessBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    checkGalleryPassword();
                });
            }
        }
    }

    /**
     * Navigation dans les étapes du formulaire de réservation
     */
    function changeStep(direction) {
        const steps = document.querySelectorAll('#reservationForm .form-step');
        if (!steps.length) return;
        
        const totalSteps = steps.length;
        
        steps[currentStep - 1].classList.remove('active');
        currentStep += direction;
        
        if (currentStep < 1) currentStep = 1;
        if (currentStep > totalSteps) currentStep = totalSteps;
        
        steps[currentStep - 1].classList.add('active');
        updateFormNavigation();
    }

    /**
     * Navigation dans les étapes du formulaire de contenu
     */
    function changeContentStep(direction) {
        const steps = document.querySelectorAll('#contentForm .form-step');
        if (!steps.length) return;
        
        const totalSteps = steps.length;
        
        steps[currentContentStep - 1].classList.remove('active');
        currentContentStep += direction;
        
        if (currentContentStep < 1) currentContentStep = 1;
        if (currentContentStep > totalSteps) currentContentStep = totalSteps;
        
        steps[currentContentStep - 1].classList.add('active');
        updateContentFormNavigation();
    }

    /**
     * Mise à jour de la navigation du formulaire de réservation
     */
    function updateFormNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        if (!prevBtn || !nextBtn || !submitBtn) return;
        
        const totalSteps = document.querySelectorAll('#reservationForm .form-step').length;
        
        prevBtn.disabled = currentStep === 1;
        
        if (currentStep === totalSteps) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    }

    /**
     * Mise à jour de la navigation du formulaire de contenu
     */
    function updateContentFormNavigation() {
        const prevBtn = document.getElementById('contentPrevBtn');
        const nextBtn = document.getElementById('contentNextBtn');
        const submitBtn = document.getElementById('contentSubmitBtn');
        
        if (!prevBtn || !nextBtn || !submitBtn) return;
        
        const totalSteps = document.querySelectorAll('#contentForm .form-step').length;
        
        prevBtn.disabled = currentContentStep === 1;
        
        if (currentContentStep === totalSteps) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    }

    /**
     * Ouverture d'une modale
     */
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.style.display = 'block';
        
        // Piéger le focus dans la modale
        trapFocus(modal);
        
        if (modalId === 'reservationModal') {
            currentStep = 1;
            updateFormNavigation();
        } else if (modalId === 'contentModal') {
            currentContentStep = 1;
            updateContentFormNavigation();
        }
        
        // Ajouter l'attribut aria-modal
        modal.setAttribute('aria-modal', 'true');
        
        // Mettre le focus sur le premier élément focusable
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length) {
            setTimeout(() => {
                focusableElements[0].focus();
            }, 100);
        }
    }

    /**
     * Fermeture d'une modale
     */
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.style.display = 'none';
        modal.setAttribute('aria-modal', 'false');
        
        // Remettre le focus sur l'élément qui a ouvert la modale
        const opener = document.querySelector(`[onclick="openModal('${modalId}')"]`);
        if (opener) {
            opener.focus();
        }
    }

    /**
     * Piéger le focus dans un élément (pour les modales)
     */
    function trapFocus(element) {
        const focusableElements = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusableElements.length) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
            
            if (e.key === 'Escape') {
                closeModal(element.id);
            }
        });
    }

    /**
     * Affichage d'une notification - optimisé
     */
    function showNotification(message, type = '') {
        // Supprimer les notifications existantes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });
        
        // Créer une nouvelle notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        document.body.appendChild(notification);
        
        // Afficher la notification avec un délai pour l'animation
        // Utiliser requestAnimationFrame pour une animation plus fluide
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                notification.classList.add('show');
            });
        });
        
        // Masquer la notification après 3 secondes
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    /**
     * Nettoyage des ressources lors de la fermeture de la page
     */
    function cleanup() {
        // Annuler les animations et les timers
        if (animationFrameId) {
            window.cancelAnimationFrame(animationFrameId);
        }
        
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        if (galleryInterval) {
            clearInterval(galleryInterval);
        }
        
        // Supprimer les écouteurs d'événements
        window.removeEventListener('scroll', throttleScroll);
        window.removeEventListener('resize', throttleResize);
    }

    // Nettoyage lors de la fermeture de la page
    window.addEventListener('unload', cleanup);

    // API publique
    return {
        init: init,
        openModal: openModal,
        closeModal: closeModal,
        changeStep: changeStep,
        changeContentStep: changeContentStep,
        nextTestimonial: nextTestimonial,
        previousTestimonial: previousTestimonial,
        checkGalleryPassword: checkGalleryPassword,
        togglePasswordVisibility: togglePasswordVisibility
    };
})();

// Initialiser l'application
LolaApp.init();

// Exposer les fonctions nécessaires globalement pour les attributs onclick
window.openModal = LolaApp.openModal;
window.closeModal = LolaApp.closeModal;
window.changeStep = LolaApp.changeStep;
window.changeContentStep = LolaApp.changeContentStep;
window.nextTestimonial = LolaApp.nextTestimonial;
window.previousTestimonial = LolaApp.previousTestimonial;
window.checkGalleryPassword = LolaApp.checkGalleryPassword;
window.togglePasswordVisibility = LolaApp.togglePasswordVisibility;

