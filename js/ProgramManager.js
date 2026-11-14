class ProgramManager {
    selectors = {
        root: '[data-js-program-list]',
        filters: '[data-js-program-filters]',
        sort: '[data-js-sort-select]',
        card: '.spec-card',
        filterBtn: '.filter-btn',
    }

    stateClasses = {
        isActive: 'is-active',
        isHidden: 'is-hidden',
    }

    constructor() {
        this.rootElement = document.querySelector(this.selectors.root)
        this.filterContainerElement = document.querySelector(this.selectors.filters)
        this.sortElement = document.querySelector(this.selectors.sort)

        if (this.rootElement) {
            this.cardsData = Array.from(this.rootElement.querySelectorAll(this.selectors.card)).map(card => ({
                element: card,
                title: card.querySelector('.spec-card__title').textContent.trim(),
                code: card.querySelector('.spec-card__code').textContent.trim(),
                base: card.dataset.base // '9' или '11'
            }))

            this.currentFilter = 'all'
            this.currentSort = 'default'

            this.bindEvents()
        }
    }

    onFilterClick = (event) => {
        const button = event.target.closest(this.selectors.filterBtn)
        if (!button) return

        this.filterContainerElement.querySelectorAll(this.selectors.filterBtn).forEach(btn => {
            btn.classList.remove(this.stateClasses.isActive)
        })
        button.classList.add(this.stateClasses.isActive)

        this.currentFilter = button.dataset.filter
        this.updateView()
    }

    onSortChange = (event) => {
        this.currentSort = event.target.value
        this.updateView()
    }

    updateView() {
        // 1. Фильтрация
        let filtered = this.cardsData.filter(item => {
            if (this.currentFilter === 'all') return true
            return item.base === this.currentFilter
        })

        // 2. Сортировка
        filtered.sort((a, b) => {
            if (this.currentSort === 'title-asc') {
                return a.title.localeCompare(b.title)
            } else if (this.currentSort === 'title-desc') {
                return b.title.localeCompare(a.title)
            } else if (this.currentSort === 'code') {
                return a.code.localeCompare(b.code)
            }
            return 0
        })

        // 3. Рендеринг в DOM
        this.cardsData.forEach(item => item.element.classList.add(this.stateClasses.isHidden))

        filtered.forEach(item => {
            item.element.classList.remove(this.stateClasses.isHidden)
            this.rootElement.appendChild(item.element)
        })
    }

    bindEvents() {
        if (this.filterContainerElement) {
            this.filterContainerElement.addEventListener('click', this.onFilterClick)
        }
        if (this.sortElement) {
            this.sortElement.addEventListener('change', this.onSortChange)
        }
    }
}

export default ProgramManager