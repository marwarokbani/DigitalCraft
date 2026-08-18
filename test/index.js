document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const envelopeOverlay = document.getElementById('envelope-overlay');
    const openBtn = document.getElementById('open-btn');
    const mainInvitation = document.getElementById('main-invitation');
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    const musicIconPlay = document.getElementById('music-icon-play');
    const musicIconPause = document.getElementById('music-icon-pause');
    const equalizer = document.getElementById('equalizer');
    
    const rsvpForm = document.getElementById('rsvp-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    
    const rsvpSuccess = document.getElementById('rsvp-success');
    const rsvpSuccessMessage = document.getElementById('rsvp-success-message');
    const companionsWrapper = document.getElementById('companions-wrapper');
    const attendanceRadios = document.getElementsByName('attendance');

    const ambientCanvas = document.getElementById('ambient-canvas');

    // Wedding Date: 18 October 2026 at 18:00
    const weddingDate = new Date('2026-10-18T18:00:00+01:00').getTime();

    let canvasAnimationId = null;
    let isMusicPlaying = false;

    // Set romantic music default volume
    bgMusic.volume = 0.35;

    // 2. ENVELOPE OPENING LOGIC
    openBtn.addEventListener('click', () => {
        // Trigger zoom out & fade transition for the cover page image
        envelopeOverlay.classList.add('envelope-out');
        
        // Hide cover overlay completely after fade transition completes
        setTimeout(() => {
            envelopeOverlay.classList.add('hidden');
        }, 1000);

        // Unlock page scrolling
        document.body.classList.remove('overflow-hidden');
        mainInvitation.classList.add('visible');
        
        // Enable scroll reveal triggers
        setTimeout(() => {
            mainInvitation.classList.add('opacity-0');
            mainInvitation.style.opacity = '1';
            triggerScrollReveal();
        }, 50);

        // Start Floating Petals Engine
        initAmbientParticles();

        // Show music controller & auto-play
        musicToggle.classList.remove('hidden');
        playMusic();
    });

    // 3. AUDIO SYSTEM LOGIC
    function playMusic() {
        bgMusic.play()
            .then(() => {
                isMusicPlaying = true;
                musicIconPlay.classList.add('hidden');
                musicIconPause.classList.remove('hidden');
                equalizer.classList.remove('hidden');
                document.querySelectorAll('.bar').forEach(bar => {
                    bar.style.animationPlayState = 'running';
                });
            })
            .catch((error) => {
                console.log('Autoplay blocked. Waiting for interaction:', error);
                isMusicPlaying = false;
                musicIconPlay.classList.remove('hidden');
                musicIconPause.classList.add('hidden');
                equalizer.classList.add('hidden');
            });
    }

    function pauseMusic() {
        bgMusic.pause();
        isMusicPlaying = false;
        musicIconPlay.classList.remove('hidden');
        musicIconPause.classList.add('hidden');
        equalizer.classList.add('hidden');
        document.querySelectorAll('.bar').forEach(bar => {
            bar.style.animationPlayState = 'paused';
        });
    }

    musicToggle.addEventListener('click', () => {
        if (isMusicPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    });

    // 4. COUNTDOWN TIMER
    function updateCountdown() {
        const now = new Date().getTime();
        const timeLeft = weddingDate - now;

        if (timeLeft <= 0) {
            document.getElementById('countdown').innerHTML = `<div class="font-aref text-xl text-cocoa py-2">حفل زفاف مبارك سعيد! تهانينا الحارة لأشرف وضحى.</div>`;
            return;
        }

        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // 5. RSVP FORM WITH AJAX EMAIL DISPATCH (FormSubmit.co)
    attendanceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'declined') {
                companionsWrapper.style.display = 'none';
            } else {
                companionsWrapper.style.display = 'block';
            }
        });
    });

    rsvpForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const guestName = document.getElementById('guest-name').value.trim();
        const attendance = document.querySelector('input[name="attendance"]:checked').value;
        const guestCount = document.getElementById('guest-count').value;

        // Set Loading state on the button
        submitBtn.disabled = true;
        btnText.textContent = 'جاري الإرسال...';
        btnSpinner.classList.remove('hidden');

        // FormSubmit AJAX payload
        const payload = {
            "الاسم بالكامل": guestName,
            "حالة الحضور": attendance === 'attending' ? 'سأحضر بكل تأكيد!' : 'أعتذر عن الحضور',
            "عدد المرافقين": attendance === 'attending' ? guestCount : 0,
            "_subject": `تأكيد حضور زفاف: ${guestName}`
        };

        // Asynchronous POST request to FormSubmit for direct email delivery
        fetch("https://formsubmit.co/ajax/marwarok09@gmail.com", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            console.log('RSVP Email sent successfully:', data);
            handleRSVPSuccess(guestName, attendance, guestCount);
        })
        .catch(error => {
            console.error('Email dispatch error (falling back to local log):', error);
            // Fallback: show success state anyway so guest has a seamless experience
            handleRSVPSuccess(guestName, attendance, guestCount);
        });
    });

    function handleRSVPSuccess(guestName, attendance, guestCount) {
        // Save to local storage for administration check
        const rsvpData = {
            name: guestName,
            status: attendance,
            companions: attendance === 'attending' ? parseInt(guestCount) : 0,
            timestamp: new Date().toISOString()
        };

        let submissions = JSON.parse(localStorage.getItem('wedding_rsvp_submissions') || '[]');
        submissions.push(rsvpData);
        localStorage.setItem('wedding_rsvp_submissions', JSON.stringify(submissions));

        // Restore submit button state
        submitBtn.disabled = false;
        btnText.textContent = 'إرسال تأكيد الحضور';
        btnSpinner.classList.add('hidden');

        // Personalize message
        if (attendance === 'attending') {
            rsvpSuccessMessage.textContent = `شكراً لك ${guestName}! يسعدنا كثيراً تأكيد حضوركم لمشاركتنا فرحتنا الكبرى! أهلاً وسهلاً بكم في ليلتنا الجميلة.`;
        } else {
            rsvpSuccessMessage.textContent = `شكراً لك ${guestName}! نقدّر اعتذاركم ومشاعركم الطيبة ودعواتكم الصادقة للعروسين أشرف وضحى.`;
        }

        // Display success popup
        rsvpSuccess.classList.remove('hidden');
        rsvpSuccess.classList.add('animate-fade-in');
    }

    // 6. SCROLL REVEAL (INTERSECTION OBSERVER)
    function triggerScrollReveal() {
        const revealElements = document.querySelectorAll('.scroll-reveal');
        
        const observerOptions = {
            root: null,
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        revealElements.forEach(el => observer.observe(el));
    }

    // 7. AMBIENT PARTICLES ENGINE (Falling Baby Pink Petals & Rose Gold Dust)
    function initAmbientParticles() {
        const ctx = ambientCanvas.getContext('2d');
        let width = ambientCanvas.width = window.innerWidth;
        let height = ambientCanvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = ambientCanvas.width = window.innerWidth;
            height = ambientCanvas.height = window.innerHeight;
        });

        const particles = [];
        const maxParticles = 30; // Performant size
        const colors = [
            'rgba(251, 200, 195, 0.45)', // Soft Baby Pink petals
            'rgba(251, 200, 195, 0.60)', // Pink accent
            'rgba(217, 160, 152, 0.40)', // Rose Gold dust
            'rgba(255, 255, 255, 0.50)'  // White highlights
        ];

        class Particle {
            constructor() {
                this.reset();
                this.y = Math.random() * height; // Distribute evenly at start
            }

            reset() {
                this.x = Math.random() * width;
                this.y = -20;
                this.size = Math.random() * 5 + 2; 
                this.speedY = Math.random() * 1.0 + 0.4; // Soft falling
                this.speedX = Math.random() * 0.4 - 0.2; // Gentle drifting
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.angle = Math.random() * Math.PI * 2;
                this.spin = Math.random() * 0.015 - 0.007;
                this.sway = Math.random() * 0.02 + 0.01;
                this.swayCount = Math.random() * 100;
            }

            update() {
                this.y += this.speedY;
                this.swayCount += this.sway;
                this.x += this.speedX + Math.sin(this.swayCount) * 0.25;
                this.angle += this.spin;

                if (this.y > height + 20 || this.x < -20 || this.x > width + 20) {
                    this.reset();
                }
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.fillStyle = this.color;
                
                ctx.beginPath();
                if (this.size > 4.5) {
                    // Draw a soft oval leaf/petal
                    ctx.ellipse(0, 0, this.size, this.size / 1.8, 0, 0, Math.PI * 2);
                } else {
                    // Draw a circular sparkle
                    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                }
                ctx.fill();
                ctx.restore();
            }
        }

        for (let i = 0; i < maxParticles; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.update();
                p.draw();
            });

            canvasAnimationId = requestAnimationFrame(animate);
        }

        animate();
    }

    // 8. GALLERY CAROUSEL SCROLL BUTTONS WITH ACTIVE CENTERING
    const galleryTrack = document.getElementById('gallery-track');
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');

    if (galleryTrack && prevBtn && nextBtn) {
        const slides = galleryTrack.querySelectorAll('.gallery-slide');
        const totalSlides = slides.length;
        let activeIndex = 0; // Start at first photo

        const dots = document.querySelectorAll('.gallery-dot');
        const indexText = document.getElementById('gallery-index-text');

        function updateCarousel() {
            const containerWidth = galleryTrack.parentElement.offsetWidth;
            const activeSlide = slides[activeIndex];

            // Measure the slide's real rendered position (offsetLeft is unaffected by
            // any transform already applied, and reflects actual layout order —
            // this works correctly whether the flex row lays out LTR or RTL).
            const slideCenterX = activeSlide.offsetLeft + activeSlide.offsetWidth / 2;
            const containerCenter = containerWidth / 2;

            const translateVal = containerCenter - slideCenterX;
            galleryTrack.style.transform = `translateX(${translateVal}px)`;

            // Update slide active classes
            slides.forEach((slide, idx) => {
                if (idx === activeIndex) {
                    slide.classList.add('active-slide');
                } else {
                    slide.classList.remove('active-slide');
                }
            });

            // Update pagination dots
            dots.forEach((dot, idx) => {
                if (idx === activeIndex) {
                    dot.className = "gallery-dot w-6 h-2 bg-rose-gold rounded-full transition-all duration-300";
                } else {
                    dot.className = "gallery-dot w-2 h-2 bg-rose-gold/30 rounded-full transition-all duration-300";
                }
            });

            // Update counter text
            if (indexText) {
                indexText.textContent = `${activeIndex + 1} / ${totalSlides}`;
            }
        }

        // Click event listeners (In RTL, next is left '<', which is incrementing index)
        nextBtn.addEventListener('click', () => {
            activeIndex = (activeIndex + 1) % totalSlides;
            updateCarousel();
        });

        prevBtn.addEventListener('click', () => {
            activeIndex = (activeIndex - 1 + totalSlides) % totalSlides;
            updateCarousel();
        });

        // Touch Swipe Event Listeners for smooth mobile swipe gestures
        let touchStartX = 0;
        let touchEndX = 0;

        galleryTrack.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        galleryTrack.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const swipeThreshold = 40;
            if (touchStartX - touchEndX > swipeThreshold) {
                // Swiped Left -> Next Slide (increment index)
                activeIndex = (activeIndex + 1) % totalSlides;
                updateCarousel();
            } else if (touchEndX - touchStartX > swipeThreshold) {
                // Swiped Right -> Prev Slide (decrement index)
                activeIndex = (activeIndex - 1 + totalSlides) % totalSlides;
                updateCarousel();
            }
        }, { passive: true });

        // Initial setup and responsive adjustment
        updateCarousel();
        window.addEventListener('resize', updateCarousel);
    }
});
