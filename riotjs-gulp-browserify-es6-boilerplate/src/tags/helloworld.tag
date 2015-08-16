<helloworld>
    <h1>{ title }</h1>
    <input id="addInput" onkeyup={ add } />
    <button id="subtractButton" onclick={ subtract }>Subtract</button>
    <button id="clearButton" onclick={ clear }>Clear</button>
    <div>Count: { count }</div>
    <div>Double: <double number={ count }></double></div>
    <script type="es6">
        title = `${ opts.title } World!`
        count = 0;
        double = 0;

        add = (e) => {
            count++
            this.update()
        }

        subtract = (e) => {
            if (count > 0) {
                addInput.value = removeLast(addInput.value)
                count--
            }
        }

        clear = (e) => {
            addInput.value = ''
            count = 0
        }

        removeLast = (text) => {
            return text.substr(0, text.length-1)
        }

        // setInterval(add, 1000)
    </script>
</helloworld>

<double>
    <span>{ opts.number * 2 }</span>
</double>
