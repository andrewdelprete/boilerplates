<people-count>
    <div each={ countArray }><b>{{ title }}</b>: <span class={ class }>{{ count }}</span></div>

    <script type="es6">
        this.mixin('peoplelistObservable');
        this.on('setCountStore', (count) => {
            this.countArray = count
            this.update()
        })
    </script>
</people-count>
