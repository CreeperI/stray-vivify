

export const notify = (function () {
  const notifyElement = document.createElement('div')
  notifyElement.classList.add('notify-box')
  const enterAnimation = 'notify-a-enter'
  const leaveAnimation = 'notify-a-leave'

  function showNotify(message: string, duration: number, elClass = 'notify-normal') {
    const container = document.getElementById('n-c')
    if (!container) return

    const element = notifyElement.cloneNode() as HTMLDivElement

    element.innerHTML = message
    element.classList.add(elClass)
    container.appendChild(element)

    let entered = false
    let leaved = false
    let isLeaving = false

    function enter() {
      element.classList.add(enterAnimation)
    }

    function stopEnter() {
      if (entered) {
        return
      }
      entered = true
      element.classList.remove(enterAnimation)
    }

    function leave() {
      if (isLeaving) {
        return
      }
      element.classList.add(leaveAnimation)
      isLeaving = true
    }

    function stopLeave() {
      if (leaved) {
        return
      }
      element.classList.remove(leaveAnimation)
      leaved = true
      element.remove()
    }

    enter()
    setTimeout(stopEnter, 300)
    setTimeout(leave, 300 + duration)
    setTimeout(stopLeave, 500 + duration)
  }

  return {
    normal: (text: string, duration = 1000) => showNotify(text, duration, 'notify-normal'),
    error: (text: string, duration = 1000) => showNotify(text, duration, 'notify-error'),
    success: (text: string, duration = 1000) => showNotify(text, duration, 'notify-success')
  }
})()
