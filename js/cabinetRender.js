class Cabinet {
    selectors = {
        root: '[data-js-cabinet]',
        authRequiredBlock: '[data-js-cabinet-auth-required]',
        cabinetContentBlock: '[data-js-cabinet-content]',
        profileName: '[data-js-profile-name]',
        profileSpecialty: '[data-js-profile-specialty]',
        profileGroup: '[data-js-profile-group]',
        profileCourse: '[data-js-profile-course]',
        profileEmail: '[data-js-profile-email]',
        requestsList: '[data-js-requests-list]',
        logoutButton: '[data-js-logout-button]',
        headerSignBlock: '[data-js-header-sign]',
        
        // Селекторы формы услуг
        serviceForm: '[data-js-service-form]',
        docTypeSelect: '#doc-type',
        copiesInput: '#copies',
        deliverySelect: '#delivery',
        commentInput: '#comment',
        serviceMessage: '[data-js-service-message]',
    }

    constructor() {
        this.rootElement = document.querySelector(this.selectors.root)
        this.authRequiredBlockElement = document.querySelector(this.selectors.authRequiredBlock)
        this.cabinetContentBlockElement = document.querySelector(this.selectors.cabinetContentBlock)
        
        this.profileNameElement = document.querySelector(this.selectors.profileName)
        this.profileSpecialtyElement = document.querySelector(this.selectors.profileSpecialty)
        this.profileGroupElement = document.querySelector(this.selectors.profileGroup)
        this.profileCourseElement = document.querySelector(this.selectors.profileCourse)
        this.profileEmailElement = document.querySelector(this.selectors.profileEmail)
        this.requestsListElement = document.querySelector(this.selectors.requestsList)
        this.logoutButtonElement = document.querySelector(this.selectors.logoutButton)
        this.headerSignElements = document.querySelectorAll(this.selectors.headerSignBlock)

        this.serviceFormElement = document.querySelector(this.selectors.serviceForm)
        this.docTypeSelectElement = document.querySelector(this.selectors.docTypeSelect)
        this.copiesInputElement = document.querySelector(this.selectors.copiesInput)
        this.deliverySelectElement = document.querySelector(this.selectors.deliverySelect)
        this.commentInputElement = document.querySelector(this.selectors.commentInput)
        this.serviceMessageElement = document.querySelector(this.selectors.serviceMessage)

        // Управление хедерами на всех страницах
        this.initSessionState()

        // Страница личного кабинета
        if (this.rootElement) {
            this.initCabinet()
        }

        // Страница заказа услуг
        if (this.serviceFormElement) {
            this.initServiceForm()
        }
    }

    initSessionState() {
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
            this.headerSignElements.forEach(el => { el.style.display = 'none' })
        } else {
            this.headerSignElements.forEach(el => { el.style.display = 'flex' })
        }
    }

    async initCabinet() {
        const savedUser = localStorage.getItem('user')
        if (!savedUser) {
            this.showAuthRequired()
            return
        }

        try {
            const user = JSON.parse(savedUser)
            this.showCabinetContent()
            this.renderUserData(user)
            await this.fetchFreshData(user.id)
        } catch (e) {
            console.error('Ошибка парсинга пользователя:', e)
            localStorage.removeItem('user')
            this.showAuthRequired()
            return
        }

        this.logoutButtonElement?.addEventListener('click', this.onLogoutButtonClick)
    }

    showAuthRequired() {
        if (this.authRequiredBlockElement) {
            this.authRequiredBlockElement.classList.remove('is-hidden')
            this.authRequiredBlockElement.style.display = 'block'
        }
        if (this.cabinetContentBlockElement) {
            this.cabinetContentBlockElement.classList.add('is-hidden')
            this.cabinetContentBlockElement.style.display = 'none'
        }
    }

    showCabinetContent() {
        if (this.authRequiredBlockElement) {
            this.authRequiredBlockElement.classList.add('is-hidden')
            this.authRequiredBlockElement.style.display = 'none'
        }
        if (this.cabinetContentBlockElement) {
            this.cabinetContentBlockElement.classList.remove('is-hidden')
            this.cabinetContentBlockElement.style.display = 'block'
        }
    }

    renderUserData(user) {
        if (this.profileNameElement) this.profileNameElement.textContent = user.fullname || 'Студент'
        if (this.profileSpecialtyElement) this.profileSpecialtyElement.textContent = user.specialty || 'Не указана'
        if (this.profileGroupElement) this.profileGroupElement.textContent = user.group_name || 'Не указана'
        if (this.profileCourseElement) this.profileCourseElement.textContent = `${user.course || 1} курс`
        if (this.profileEmailElement) this.profileEmailElement.textContent = user.email || '-'
    }

    async fetchFreshData(userId) {
        try {
            const requestsRes = await fetch(`/api/requests/${userId}`)
            if (requestsRes.ok) {
                const requests = await requestsRes.json()
                this.renderRequests(requests)
            }
        } catch (e) {
            console.error('Ошибка загрузки заявок:', e)
        }
    }

    renderRequests(requests) {
        if (!this.requestsListElement) return

        if (requests.length === 0) {
            this.requestsListElement.innerHTML = `<p style="color: #5e6c84; font-size: 14px;">У вас пока нет поданных заявок на справки.</p>`
            return
        }

        this.requestsListElement.innerHTML = ''
        requests.forEach(req => {
            let badgeClass = 'status-badge--process'
            if (req.status === 'Одобрена') badgeClass = 'status-badge--approved'
            if (req.status === 'Отклонена') badgeClass = 'status-badge--rejected'

            const dateFormatted = new Date(req.created_at).toLocaleDateString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })

            const itemHTML = `
                <div class="tracker-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #ebecf0;" data-request-id="${req.id}">
                    <div class="tracker-item__info">
                        <strong style="display: block; font-size: 14px; color: #172b4d; margin-bottom: 4px;">Заявка #${req.id} — ${req.certificate_type}</strong>
                        <span style="font-size: 12px; color: #5e6c84;">Подана: ${dateFormatted} ${req.comment ? '• ' + req.comment : ''}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="status-badge ${badgeClass}" style="padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;">${req.status}</span>
                        <button type="button" class="btn-delete-request" data-id="${req.id}" title="Удалить заявку" style="background: none; border: none; color: #bf2600; cursor: pointer; font-size: 16px;">✕</button>
                    </div>
                </div>
            `
            this.requestsListElement.insertAdjacentHTML('beforeend', itemHTML)
        })

        this.requestsListElement.querySelectorAll('.btn-delete-request').forEach(btn => {
            btn.addEventListener('click', (e) => this.onRequestDelete(e))
        })
    }

    onRequestDelete = async (e) => {
        const requestId = e.currentTarget.dataset.id
        if (!confirm(`Удалить заявку #${requestId}?`)) return

        try {
            const response = await fetch(`/api/requests/${requestId}`, { method: 'DELETE' })
            if (response.ok) {
                e.currentTarget.closest('.tracker-item')?.remove()
                if (this.requestsListElement.children.length === 0) {
                    this.requestsListElement.innerHTML = `<p style="color: #5e6c84; font-size: 14px;">У вас пока нет поданных заявок на справки.</p>`
                }
            } else {
                console.error('Не удалось удалить заявку')
            }
        } catch (err) {
            console.error('Ошибка сети:', err)
        }
    }

    initServiceForm() {
        this.serviceFormElement.addEventListener('submit', async (e) => {
            e.preventDefault()

            const savedUser = localStorage.getItem('user')
            if (!savedUser) {
                this.showServiceMessage('Пожалуйста, войдите в личный кабинет для подачи заявки!', true)
                return
            }

            const user = JSON.parse(savedUser)
            const docType = this.docTypeSelectElement?.value
            const copies = this.copiesInputElement?.value || 1
            const delivery = this.deliverySelectElement?.value || 'digital'
            const userComment = this.commentInputElement?.value.trim() || ''

            if (!docType) {
                this.showServiceMessage('Выберите тип документа!', true)
                return
            }

            const deliveryText = delivery === 'digital' ? 'Электронный PDF' : 'Бумажный оригинал'
            const certificateType = `${docType} (Копий: ${copies}, Способ: ${deliveryText})`

            try {
                const response = await fetch('/api/requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        userId: user.id, 
                        certificateType: certificateType, 
                        comment: userComment 
                    })
                })

                const result = await response.json()

                if (!response.ok) {
                    this.showServiceMessage(result.error || 'Ошибка отправки', true)
                    return
                }

                this.showServiceMessage('Заявка успешно отправлена! Перенаправление...', false)
                this.serviceFormElement.reset()

                setTimeout(() => {
                    window.location.href = 'cabinet.html'
                }, 1200)

            } catch (err) {
                console.error('Ошибка сети:', err)
                this.showServiceMessage('Не удалось связаться с сервером', true)
            }
        })
    }

    showServiceMessage(text, isError = false) {
        if (!this.serviceMessageElement) return
        this.serviceMessageElement.style.color = isError ? '#bf2600' : '#006644'
        this.serviceMessageElement.textContent = text
    }

    onLogoutButtonClick = () => {
        localStorage.removeItem('user')
        window.location.reload()
    }
}

export default Cabinet