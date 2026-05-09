document.addEventListener("DOMContentLoaded", function () {

    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const dropdowns = document.querySelectorAll('.dropdown');

    // ===========================
    // MOBILE MENU TOGGLE
    // ===========================
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();

            navLinks.classList.toggle('active');

            // Change icon
            menuToggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';

            // Close all dropdowns when menu closes
            if (!navLinks.classList.contains('active')) {
                dropdowns.forEach(d => d.classList.remove('active'));
            }
        });
    }

    // ===========================
    // MOBILE DROPDOWN FIX
    // ===========================
    dropdowns.forEach(dropdown => {

        const toggle = dropdown.querySelector('.dropdown-toggle');
        const submenu = dropdown.querySelector('.submenu');

        if (!toggle || !submenu) return;

        toggle.addEventListener('click', function (e) {

            if (window.innerWidth <= 859) {
                e.preventDefault();
                e.stopPropagation();

                const isOpen = dropdown.classList.contains('active');

                // Close all dropdowns
                dropdowns.forEach(d => d.classList.remove('active'));

                // Open clicked one only
                if (!isOpen) {
                    dropdown.classList.add('active');
                }
            }
        });

        // Prevent submenu click from closing menu
        submenu.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    });

    // ===========================
    // DESKTOP DROPDOWN POSITIONING
    // ===========================
    dropdowns.forEach(dropdown => {
        const submenu = dropdown.querySelector('.submenu');

        dropdown.addEventListener('mouseenter', () => {
            if (window.innerWidth > 859 && submenu) {
                positionSubmenu(dropdown, submenu);
            }
        });
    });

    function positionSubmenu(dropdown, submenu) {
        const rect = dropdown.getBoundingClientRect();
        const submenuHeight = submenu.scrollHeight;
        const viewportHeight = window.innerHeight;

        submenu.style.left = rect.left + "px";

        if (viewportHeight - rect.bottom < submenuHeight + 20) {
            const spaceAbove = rect.top;

            if (spaceAbove > submenuHeight) {
                submenu.style.top = (rect.top - submenuHeight - 10) + "px";
            } else {
                submenu.style.top = rect.bottom + 10 + "px";
                submenu.style.maxHeight = (viewportHeight - rect.bottom - 20) + "px";
            }
        } else {
            submenu.style.top = rect.bottom + 10 + "px";
            submenu.style.maxHeight = "80vh";
        }
    }

    // ===========================
    // CLOSE MENU ON OUTSIDE CLICK
    // ===========================
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 859) {
            if (!e.target.closest('nav')) {
                navLinks.classList.remove('active');
                if (menuToggle) menuToggle.textContent = '☰';
                dropdowns.forEach(d => d.classList.remove('active'));
            }
        }
    });

    // ===========================
    // SMOOTH SCROLL
    // ===========================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {

            // Skip dropdown toggle click
            if (this.classList.contains('dropdown-toggle') && window.innerWidth <= 859) {
                return;
            }

            const href = this.getAttribute('href');
            const target = document.querySelector(href);

            if (target) {
                e.preventDefault();

                navLinks.classList.remove('active');
                if (menuToggle) menuToggle.textContent = '☰';

                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: "smooth"
                });
            }
        });
    });

    // ===========================
    // SCROLL ANIMATION
    // ===========================
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card, .news-card, .about p').forEach(el => {
        el.style.opacity = 0;
        el.style.transform = "translateY(25px)";
        el.style.transition = "0.6s";
        observer.observe(el);
    });

    // ===========================
    // HEADER SHADOW ON SCROLL
    // ===========================
    const header = document.querySelector("header");

    window.addEventListener("scroll", () => {
        if (!header) return;

        if (window.scrollY > 50) {
            header.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
        } else {
            header.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        }
    });

    // ===========================
    // RESET ON RESIZE
    // ===========================
    window.addEventListener("resize", () => {
        if (window.innerWidth > 859) {
            navLinks?.classList.remove("active");
            if (menuToggle) menuToggle.textContent = "☰";
            dropdowns.forEach(d => d.classList.remove("active"));
        }
    });

    // ===========================
    // ACTIVE LINK ON SCROLL
    // ===========================
    const sections = document.querySelectorAll("section[id]");

    window.addEventListener("scroll", () => {
        const scrollY = window.scrollY;

        sections.forEach(section => {
            const height = section.offsetHeight;
            const top = section.offsetTop - 150;
            const id = section.getAttribute("id");

            const link = document.querySelector(`.nav-links a[href="#${id}"]`);
            if (!link) return;

            if (scrollY > top && scrollY <= top + height) {
                document.querySelectorAll(".nav-links a").forEach(a => a.classList.remove("active"));
                link.classList.add("active");
            }
        });
    });

    // ===========================
    // ACCESSIBILITY (ENTER KEY)
    // ===========================
    document.querySelectorAll(".dropdown-toggle").forEach(link => {
        link.addEventListener("keydown", e => {
            if (e.key === "Enter" && window.innerWidth <= 859) {
                e.preventDefault();
                const dropdown = link.parentElement;
                dropdown.classList.toggle("active");
            }
        });
    });

    // ===========================
    // CONSOLE MESSAGE
    // ===========================
    console.log(
        "%c NLC India Limited - Corporate Communication Department ",
        "background:#1e3a8a;color:#fff;padding:10px;font-size:16px;font-weight:bold"
    );

});