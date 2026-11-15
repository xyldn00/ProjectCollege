class AdminPanel {
    selectors = {
        requestsList: '[data-js-admin-requests-list]',
        messageBlock: '[data-js-admin-message]',
        logoutButton: '[data-js-admin-logout]',
    }

    constructor() {
        //  Строгая проверка прав администратора
        if (!this.checkAdminAccess()) {
            return
        }

        this.requestsListElement = document.querySelector(this.selectors.requestsList)
        this.messageBlockElement = document.querySelector(this.selectors.messageBlock)
        this.logoutButtonElement = document.querySelector(this.selectors.logoutButton)

        // Надежный обработчик выхода из системы
        if (this.logoutButtonElement) {
            this.logoutButtonElement.addEventListener('click', (e) => {
                e.preventDefault()
                localStorage.removeItem('user')
                window.location.href = 'index.html'
            })
        }

        // Загрузка заявок
        this.loadAllRequests()
    }

    checkAdminAccess() {
        const savedUser = localStorage.getItem('user')
        
        if (!savedUser) {
            alert('Доступ запрещен. Пожалуйста, войдите в систему.')
            window.location.href = 'index.html'
            return false
        }

        try {
            const user = JSON.parse(savedUser)
            if (user.role !== 'admin') {
                alert('У вас нет прав администратора для просмотра этой страницы.')
                window.location.href = 'cabinet.html'
                return false
            }
            return true
        } catch (e) {
            localStorage.removeItem('user')
            window.location.href = 'index.html'
            return false
        }
    }

    async loadAllRequests() {
        try {
            const response = await fetch('/api/admin/requests')
            if (!response.ok) throw new Error('Не удалось загрузить заявки с сервера')

            const requests = await response.json()
            this.renderRequests(requests)
        } catch (err) {
            console.error('Ошибка загрузки:', err)
            this.showMessage('Ошибка загрузки данных с сервера', true)
        }
    }

    renderRequests(requests) {
        if (!this.requestsListElement) return

        if (!Array.isArray(requests) || requests.length === 0) {
            this.requestsListElement.innerHTML = `
                <tr>
                    <td colspan="7" class="admin-table__empty">Пока нет ни одной заявки.</td>
                </tr>
            `
            return
        }

        this.requestsListElement.innerHTML = ''
        requests.forEach(req => {
            let badgeClass = 'status-badge--process'
            if (req.status === 'Одобрена') badgeClass = 'status-badge--approved'
            if (req.status === 'Отклонена') badgeClass = 'status-badge--rejected'

            const dateFormatted = req.created_at 
                ? new Date(req.created_at).toLocaleDateString('ru-RU', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })
                : '—'

            const rowHTML = `
                <tr data-id="${req.id}">
                    <td class="admin-table__id">#${req.id}</td>
                    <td class="admin-table__student">
                        <strong>${req.fullname || 'Неизвестно'}</strong>
                        <span>Группа: ${req.group_name || 'Не указана'}</span>
                    </td>
                    <td>${req.certificate_type || 'Справка'}</td>
                    <td class="admin-table__comment">${req.comment || '—'}</td>
                    <td class="admin-table__date">${dateFormatted}</td>
                    <td>
                        <span class="status-badge ${badgeClass}" style="padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;">${req.status}</span>
                    </td>
                    <td class="admin-table__actions">
                        <button type="button" class="btn btn--approve" data-action="approve" data-id="${req.id}">Одобрить</button>
                        <button type="button" class="btn btn--reject" data-action="reject" data-id="${req.id}">Отклонить</button>
                    </td>
                </tr>
            `
            this.requestsListElement.insertAdjacentHTML('beforeend', rowHTML)
        })

        // Обработчики на кнопки изменения статуса
        this.requestsListElement.querySelectorAll('[data-action="approve"]').forEach(btn => {
            btn.addEventListener('click', (e) => this.updateStatus(e.currentTarget.dataset.id, 'Одобрена'))
        })
        this.requestsListElement.querySelectorAll('[data-action="reject"]').forEach(btn => {
            btn.addEventListener('click', (e) => this.updateStatus(e.currentTarget.dataset.id, 'Отклонена'))
        })
    }

    async updateStatus(requestId, newStatus) {
        try {
            const response = await fetch(`/api/admin/requests/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (!response.ok) throw new Error('Не удалось обновить статус')

            this.showMessage(`Заявка #${requestId} переведена в статус: «${newStatus}»`, false)
            this.loadAllRequests()
        } catch (err) {
            console.error(err)
            this.showMessage('Ошибка при обновлении статуса', true)
        }
    }

    showMessage(text, isError = false) {
        if (!this.messageBlockElement) return
        this.messageBlockElement.classList.remove('is-error', 'is-success')
        this.messageBlockElement.classList.add(isError ? 'is-error' : 'is-success')
        this.messageBlockElement.textContent = text

        setTimeout(() => {
            this.messageBlockElement.textContent = ''
            this.messageBlockElement.classList.remove('is-error', 'is-success')
        }, 3000)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel()
})