const app = Vue.createApp({
    data() {
        return {
            groceryList: [
                { id: 0, text: 'Vegetables' },
                { id: 1, text: 'aa' },
                { id: 2, text: "bb" },
            ],
            count: 1,
            toggle: false,
        }
    },
    created() {
        console.log('count is: ' + this.count)
    },
    methods: {
        display(text) {
            if (this.toggle) {
                return text.split('').reverse().join('');
            } else {
                return text;
            }
        },
        flip_toggle() {
            this.toggle = !this.toggle;
        },
    },
    computed: {
        now() {
            return Date.now()
        }
    }
})

app.component('todo-item', {
    props: ['todo'],
    template: `<li>{{ todo.text }}</li>`,
})

const vm = app.mount('#event-handling')
