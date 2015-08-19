<peoplelist>
    <input type="text" id="nameInput" placeholder="Name" onkeyup={ edit }>
    <input type="text" id="ageInput" placeholder="Age" onkeyup={ edit }>
    <button type="button" name="button" disabled={ disabled } onclick={ add }>Add Person</button>
    <person each={ opts.people } data={ this }></person>

    <script type="es6">
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
        }

        this.remove = (e) => {
            let person = e.item
            let index = opts.people.indexOf(person)
            opts.people.splice(index, 1)
        }
    </script>
</peoplelist>

<person>
    <h1><a href onclick={ parent.remove }>X</a> - { opts.data.name } - <small>{ opts.data.age }</small></h1>
</person>
