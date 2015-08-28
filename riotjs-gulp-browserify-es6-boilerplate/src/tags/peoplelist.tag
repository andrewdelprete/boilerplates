<peoplelist>
    <input type="text" id="nameInput" placeholder="Name" onkeyup={ edit }>
    <input type="text" id="ageInput" placeholder="Age" onkeyup={ edit }>
    <button type="button" name="button" disabled={ disabled } onclick={ add }>Add Person</button>
    <person each={ opts.people } data={ this }></person>

    <script type="es6">
        this.mixin('peoplelistObservable');

        this.disabled = true

        this.edit = (e) => {
            this.disabled = (nameInput.value == '' || ageInput.value == '')
        }

        this.add = (e) => {
            opts.people.push({
                name: nameInput.value,
                age: ageInput.value
            })

            this.nameInput.value = ''
            this.ageInput.value = ''
            this.disabled = true

            this.trigger('setCountAction', _countArray());
        }

        this.remove = (e) => {
            let person = e.item
            let index = opts.people.indexOf(person)
            opts.people.splice(index, 1)

            this.trigger('setCountAction', _countArray());
        }

        this.oldFarts = (age) => {
            return age >= 60
        }

        this.whipperSnappers = (age) => {
            return age <= 20
        }

        _countArray = (e) => {
            return [
                {
                    title: "Old Farts",
                    count: opts.people
                        .map((person) => person.age)
                        .filter(this.oldFarts)
                        .length,
                        class: 'red'
                },
                {
                    title: "Whippersnappers",
                    count: opts.people
                        .map((person) => person.age)
                        .filter(this.whipperSnappers)
                        .length,
                        class: 'blue'
                },
                {
                    title: "Total",
                    count: opts.people.length
                }
            ]
        }

        this.on('mount', () => {
            this.trigger('setCountAction', _countArray())
        });
    </script>
</peoplelist>

<person>
    <h1><a href onclick={ parent.remove }>X</a> - { opts.data.name } - <small class={ red: oldFarts(opts.data.age), blue: whipperSnappers(opts.data.age) }>{ opts.data.age }</small></h1>
</person>
