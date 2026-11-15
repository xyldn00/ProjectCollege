class AuthModal {
    selectors = {
        root: '[data-js-auth-modal]',
        overlay: '[data-js-auth-modal-overlay]',
        closeButton: '[data-js-auth-modal-close]',
        signinTrigger: '.header__sign-signin',
        signupTrigger: '.header__sign-signup',
        tab: '[data-js-auth-tab]',
        tabSwitch: '[data-js-auth-switch]',
        signinForm: '[data-js-auth-tab="signin"] form',
        signupForm: '[data-js-auth-tab="signup"] form',
    }

    stateClasses = {
        isOpen: 'is-open',
        isHidden: 'is-hidden',
        isLock: 'is-lock',
    }

    constructor() {
        this.rootElement = document.querySelector(this.selectors.root)
        this.overlayElement = this.rootElement?.querySelector(this.selectors.overlay)
        this.closeButtonElement = this.rootElement?.querySelector(this.selectors.closeButton)
        this.signinTriggers = document.querySelectorAll(this.selectors.signinTrigger)
        this.signupTriggers = document.querySelectorAll(this.selectors.signupTrigger)
        this.tabs = document.querySelectorAll(this.selectors.tab)
        this.tabSwitches = document.querySelectorAll(this.selectors.tabSwitch)
        
        this.signinFormElement = this.rootElement?.querySelector(this.selectors.signinForm)
        this.signupFormElement = this.rootElement?.querySelector(this.selectors.signupForm)

        if (this.rootElement) {
            this.bindEvents()
        }
    }

    openModal = (tabName = 'signin') => {
        this.rootElement.classList.add(this.stateClasses.isOpen)
        document.documentElement.classList.add(this.stateClasses.isLock)
        this.switchTab(tabName)
    }

    closeModal = () => {
        this.rootElement.classList.remove(this.stateClasses.isOpen)
        document.documentElement.classList.remove(this.stateClasses.isLock)
    }

    switchTab(tabName) {
        this.tabs.forEach((tab) => {
            if (tab.dataset.jsAuthTab === tabName) {
                tab.classList.remove(this.stateClasses.isHidden)
            } else {
                tab.classList.add(this.stateClasses.isHidden)
            }
        })
    }

    onSigninClick = (e) => {
        e.preventDefault()
        this.openModal('signin')
    }

    onSignupClick = (e) => {
        e.preventDefault()
        this.openModal('signup')
    }

    onTabSwitchClick = (e) => {
        e.preventDefault()
        const targetTab = e.currentTarget.dataset.jsAuthSwitch
        this.switchTab(targetTab)
    }

    // ВХОД 
    onSigninSubmit = async (e) => {
        e.preventDefault()
        const inputs = this.signinFormElement.querySelectorAll('input')
        const email = inputs[0]?.value.trim()
        const password = inputs[1]?.value.trim()

        if (!email || !password) return

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const result = await response.json()

            if (!response.ok) {
                this.showFormMessage(this.signinFormElement, result.error || 'Ошибка входа', true)
                return
            }

            // Сохраняем сессию пользователя
            localStorage.setItem('user', JSON.stringify(result.user))

            // ЕСЛИ ЭТО АДМИН - СРАЗУ ПЕРЕКАТЫВАЕМ В АДМИНКУ, ИНАЧЕ В КАБИНЕТ
            if (result.user.role === 'admin') {
                window.location.href = 'admin.html'
            } else {
                window.location.href = 'cabinet.html'
            }
        } catch (err) {
            console.error('Ошибка сети:', err)
            this.showFormMessage(this.signinFormElement, 'Не удалось связаться с сервером', true)
        }
    }

    // РЕГИСТРАЦИЯ
    onSignupSubmit = async (e) => {
        e.preventDefault()
        const inputs = this.signupFormElement.querySelectorAll('input')
        const fullname = inputs[0]?.value.trim()
        const email = inputs[1]?.value.trim()
        const password = inputs[2]?.value.trim()

        if (!fullname || !email || !password) return

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname, email, password })
            })

            const result = await response.json()

            if (!response.ok) {
                this.showFormMessage(this.signupFormElement, result.error || 'Ошибка регистрации', true)
                return
            }

            // Успех: выводим текст 
            this.showFormMessage(this.signupFormElement, 'Регистрация прошла успешно! Выполняется вход...', false)

            // Сразу выполняем автоматический вход новоиспеченного пользователя
            setTimeout(async () => {
                const loginRes = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                })
                const loginData = await loginRes.json()
                if (loginRes.ok) {
                    localStorage.setItem('user', JSON.stringify(loginData.user))
                    window.location.href = 'cabinet.html'
                } else {
                    this.switchTab('signin')
                }
            }, 1200)

        } catch (err) {
            console.error('Ошибка сети:', err)
            this.showFormMessage(this.signupFormElement, 'Не удалось связаться с сервером', true)
        }
    }

    // Вспомогательный метод для вывода текста статуса в форме
    showFormMessage(formElement, message, isError = false) {
        let msgEl = formElement.querySelector('.form-status-message')
        if (!msgEl) {
            msgEl = document.createElement('p')
            msgEl.className = 'form-status-message'
            msgEl.style.fontSize = '13px'
            msgEl.style.marginTop = '12px'
            msgEl.style.textAlign = 'center'
            formElement.appendChild(msgEl)
        }
        msgEl.style.color = isError ? '#bf2600' : '#006644'
        msgEl.textContent = message
    }

    bindEvents() {
        this.signinTriggers.forEach((btn) => btn.addEventListener('click', this.onSigninClick))
        this.signupTriggers.forEach((btn) => btn.addEventListener('click', this.onSignupClick))
        
        this.closeButtonElement?.addEventListener('click', this.closeModal)
        this.overlayElement?.addEventListener('click', this.closeModal)

        this.tabSwitches.forEach((btn) => btn.addEventListener('click', this.onTabSwitchClick))

        this.signinFormElement?.addEventListener('submit', this.onSigninSubmit)
        this.signupFormElement?.addEventListener('submit', this.onSignupSubmit)

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal()
            }
        })
    }
}

export default AuthModal