<riotpedia>
    <form onsubmit={ submitHandler }>
        <input type="text" name="term" placeholder="term" />
        <input type="submit" value="wikipedia" />
    </form>
    <div each={ name, i in results }>
        { i }: { name }
    </div>

    <script type="es6">
        opts.on('search', (response) => {
            this.results = response[1]
            this.update();
        })

        submitHandler = (e) => {
            return opts.search(this.term.value);
        }
    </script>
</riotpedia>
