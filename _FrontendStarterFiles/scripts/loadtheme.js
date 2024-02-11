const link = document.createElement('link')
link.rel = "stylesheet"

const selectedTheme = localStorage.getItem("selectedTheme")
if(selectedTheme){
    let theme = JSON.parse(selectedTheme)
    link.href = theme.href
    link.integrity = theme.integrity
    link.crossOrigin = "anonymous"
    link.referrerPolicy = "no-referrer"
} else {
    link.href = `https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css`
}

document.head.appendChild(link)
