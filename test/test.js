(function() {
  if (!window.jQuery) {
    console.log("jQuery not loaded");
    return;
  }

  $(document).ready(function() {
    $('div').addClass('red-border-test');
  });
})();
