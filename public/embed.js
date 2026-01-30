(function () {
  var widgets = document.querySelectorAll("#airview-widget,[data-airview-widget]");
  if (!widgets.length) {
    return;
  }

  widgets.forEach(function (el) {
    var token = el.getAttribute("data-token");
    var style = el.getAttribute("data-style") || "card";
    var theme = el.getAttribute("data-theme") || "dark";
    if (!token) {
      return;
    }

    var baseUrl = el.getAttribute("data-base-url") || window.location.origin;
    var src = baseUrl + "/embed/" + style + "/" + token + "?theme=" + theme;

    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.frameBorder = "0";
    iframe.style.border = "0";
    iframe.style.width = style === "badge" ? "220px" : style === "full" ? "420px" : "320px";
    iframe.style.height = style === "badge" ? "60px" : style === "full" ? "520px" : "220px";

    el.innerHTML = "";
    el.appendChild(iframe);
  });
})();
