(function () {
  var widgets = document.querySelectorAll("#airview-widget,[data-airview-widget]");
  if (!widgets.length) {
    return;
  }

  widgets.forEach(function (el) {
    var token = el.getAttribute("data-token");
    var style = el.getAttribute("data-style") || "card";
    var theme = el.getAttribute("data-theme") || "dark";
    var size = el.getAttribute("data-size") || "medium";
    if (!token) {
      return;
    }

    var baseUrl = el.getAttribute("data-base-url") || window.location.origin;
    var src =
      baseUrl +
      "/embed/" +
      style +
      "/" +
      token +
      "?theme=" +
      theme +
      "&size=" +
      size;

    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.frameBorder = "0";
    iframe.style.border = "0";
    var dimensions = { width: 320, height: 220 };
    if (style === "badge") {
      if (size === "small") {
        dimensions = { width: 160, height: 40 };
      } else if (size === "large") {
        dimensions = { width: 360, height: 88 };
      } else {
        dimensions = { width: 240, height: 64 };
      }
    } else if (style === "card") {
      if (size === "small") {
        dimensions = { width: 280, height: 180 };
      } else if (size === "large") {
        dimensions = { width: 420, height: 320 };
      } else {
        dimensions = { width: 320, height: 220 };
      }
    }
    iframe.style.width = dimensions.width + "px";
    iframe.style.height = dimensions.height + "px";

    el.innerHTML = "";
    el.appendChild(iframe);
  });
})();
