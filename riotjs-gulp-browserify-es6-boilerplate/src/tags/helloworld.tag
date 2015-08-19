<helloworld>
    <h1>{ title }</h1>
    <input id="addInput" onkeyup={ add } />
    <button id="subtractInput" onclick={ subtract }>Subtract</button>
    <div>Count: { count }</div>
    <div each={ opts.people }>{ name }</div>
    <div each={ item, i in list }>{ i }: { item }</div>
    <script type="es6">
        count = 0

        subtract = (e) => {
            if (count > 0) {
                addInput.value = removeLast(addInput.value)
                count--
            }
        }

        add = (e) => {
            count++
            this.update()
        }

        removeLast = (text) => {
            return text.substr(0, text.length-1)
        }

        this.list = [
            'Banana',
            'Apple',
            'Orange',
            'Mango'
        ]

        // setInterval(add, 1000)

        title = `${ opts.title } World!`
    </script>
</helloworld>
