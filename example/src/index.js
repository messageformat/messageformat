import messages from './messages.json'

function component() {
  const element = document.createElement('div')
  element.innerHTML = [
    'In English: ' + messages.en.select({ GENDER: 'female' }),
    'Suomeksi: ' + messages.fi.select({ GENDER: 'female' })
  ].join('<br/>')
  return element
}

console.log('messages', messages)
document.body.appendChild(component())
