class FetchData {
    getResource = async url => {
        const res = await fetch(url)
        if (!res.ok) {
            throw new Error('Danger: ' + res.status)
        }
        return res.json()
    }
    getPost = () => this.getResource('db/dataBase.json')
}

class Twitter {
    constructor({ user, listElem, modalElems, tweetElems, classDeleteTweet, classLikeTweet, sortElem, showUserPostElem, showLikedPostElem }) {
        const fetchData = new FetchData()
        this.user = user
        this.tweets = new Posts()
        this.elements = {
            listElem: document.querySelector(listElem),
            sortElem: document.querySelector(sortElem),
            modal: modalElems,
            tweetElems,
            showUserPostElem: document.querySelector(showUserPostElem),
            showLikedPostElem: document.querySelector(showLikedPostElem)
        }
        this.class = {
            classDeleteTweet,
            classLikeTweet
        }
        this.sortDate = true
        fetchData.getPost()
            .then(data => {
                data.forEach(this.tweets.addPost)
                this.showAllPost()
            })
        this.elements.modal.forEach(this.handlerModal, this)
        this.elements.tweetElems.forEach(this.addTweet, this)
        this.elements.listElem.addEventListener('click', this.handlerTweet)
        this.elements.sortElem.addEventListener('click', this.changeSort)
        this.elements.showLikedPostElem.addEventListener('click', this.showLikedPost)
        this.elements.showUserPostElem.addEventListener('click', this.showUserPost)
    }

    renderPosts(posts) {
        const sortPost = posts.sort(this.sortFields())
        this.elements.listElem.textContent = ''
        sortPost.forEach(({ id, userName, nickname, text, img, likes, gateDate, liked }) => {
            this.elements.listElem.insertAdjacentHTML('beforeend', `
                <li>
                    <article class="tweet">
                        <div class="row">
                            <img class="avatar" src="images/${nickname}.jpg" alt="Аватар пользователя ${nickname} ">
                            <div class="tweet__wrapper">
                                <header class="tweet__header">
                                    <h3 class="tweet-author">${userName} 
                                        <span class="tweet-author__add tweet-author__nickname">@${nickname}</span>
                                        <time class="tweet-author__add tweet__date">${gateDate()}</time>
                                    </h3>
                                    <button class="tweet__delete-button chest-icon" data-id="${id}"></button>
                                </header>
                                <div class="tweet-post">
                                    <p class="tweet-post__text">${text}</p>
                                    ${img ? `<figure class="tweet-post__image">
                                                <img src="${img}" alt="${nickname}">
                                            </figure>` : ''}
                                </div>
                            </div>
                        </div>
                        <footer>
                            <button class="tweet__like ${liked ? this.class.classLikeTweet.active : ''}" data-id="${id}">
                                ${likes}
                            </button>
                        </footer>
                    </article>
                </li>
            `)
        })
    }

    showUserPost = () => {
        const post = this.tweets.posts.filter(item => item.nickname === this.user.nick)
        this.renderPosts(post)
    }

    showLikedPost = () => {
        const post = this.tweets.posts.filter(item => item.liked)
        this.renderPosts(post)
    }

    showAllPost() {
        this.renderPosts(this.tweets.posts)
    }

    handlerModal({ button, modal, overlay, close }) {
        const buttonElem = document.querySelector(button)
        const modalElem = document.querySelector(modal)
        const overlayElem = document.querySelector(overlay)
        const closeElem = document.querySelector(close)
        const openModal = () => {
            modalElem.style.display = 'block'
        }
        const closeModal = (elem, event) => {
            const target = event.target
            if (target === elem) {
                modalElem.style.display = 'none'
            }
        }
        buttonElem.addEventListener('click', openModal)
        if (closeElem) {
            closeElem.addEventListener('click', closeModal.bind(null, closeElem))
        }
        if (overlayElem) {
            overlayElem.addEventListener('click', closeModal.bind(null, overlayElem))
        }
        this.handlerModal.closeModal = () => {
            modalElem.style.display = 'none'
        }
    }

    addTweet({ text, img, submit }) {
        const textElem = document.querySelector(text)
        const imgElem = document.querySelector(img)
        const submitElem = document.querySelector(submit)
        let imgURL = ''
        let tempString = textElem.innerHTML

        submitElem.addEventListener('click', () => {
            this.tweets.addPost({
                userName: this.user.name,
                nickname: this.user.nick,
                text: textElem.innerHTML,
                img: imgURL
            })
            this.showAllPost()
            this.handlerModal.closeModal()
            textElem.innerHTML = tempString
        })
        textElem.addEventListener('click', () => {
            if (textElem.innerHTML === tempString) {
                textElem.innerHTML = ''
            }
        })
        imgElem.addEventListener('click', () => {
            imgURL = prompt('Введите адрес картинки!!!!!')
        })
    }

    handlerTweet = event => {
        const target = event.target
        if (target.classList.contains(this.class.classDeleteTweet)) {
            this.tweets.deletePost(target.dataset.id)
            this.showAllPost()
        }
        if (target.classList.contains(this.class.classLikeTweet.like)) {
            this.tweets.likePost(target.dataset.id)
            this.showAllPost()
        }
    }

    changeSort = () => {
        this.sortDate = !this.sortDate
        this.showAllPost()
    }

    sortFields() {
        if (this.sortDate) {
            return (a, b) => {
                const dateA = new Date(a.postDate)
                const dateB = new Date(b.postDate)
                return dateB - dateA
            }
        } else {
            return (a, b) => b.likes - a.likes
        }
    }
}

class Posts {
    constructor({ posts = [] } = {}) {
        this.posts = posts
    }

    addPost = (tweets) => {
        this.posts.push(new Post(tweets))
    }

    deletePost(id) {
        this.posts = this.posts.filter(item => item.id !== id)
    }

    likePost(id) {
        this.posts.forEach(item => {
            if (item.id === id) {
                item.changeLike()
            }
        })
    }
}

class Post {
    constructor({ id, userName, nickname, postDate, text, img, likes = 0 }) {
        this.id = id || this.generateId()
        this.userName = userName
        this.nickname = nickname
        this.postDate = postDate ? this.correctDate(postDate) : new Date()
        this.text = text
        this.img = img
        this.likes = likes
        this.liked = false
    }

    changeLike() {
        this.liked = !this.liked
        if (this.liked) {
            this.likes++
        } else {
            this.likes--
        }
    }

    generateId() {
        return Math.random().toString(32).substring(2, 9) + (+new Date).toString(32)
    }

    gateDate = () => {
        const options = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }
        return this.postDate.toLocaleString('ru-RU', options)
    }

    correctDate(date) {
        if (isNaN(Date.parse(date))) {
            date = date.replaceAll('.', '/')
        }
        return new Date(date)
    }
}

new Twitter({
    listElem: '.tweet-list',
    user: {
        name: 'Alexey',
        nick: 'pianist'
    },
    modalElems: [
        {
            button: '.header__link_tweet',
            modal: '.modal',
            overlay: '.overlay',
            close: '.modal-close__btn'
        }
    ],
    tweetElems: [
        {
            text: '.modal .tweet-form__text',
            img: '.modal .tweet-img__btn',
            submit: '.modal .tweet-form__btn'
        },
        {
            text: '.tweet-form__text',
            img: '.tweet-img__btn',
            submit: '.tweet-form__btn'
        }
    ],
    classDeleteTweet: 'tweet__delete-button',
    classLikeTweet: {
        like: 'tweet__like',
        active: 'tweet__like_active'
    },
    sortElem: '.header__link_sort',
    showUserPostElem: '.header__link_profile',
    showLikedPostElem: '.header__link_likes'
})
