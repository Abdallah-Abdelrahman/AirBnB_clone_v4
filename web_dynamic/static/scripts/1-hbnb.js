/* global $ */
$(document).ready(function () {
  const amenities = [];
  $('input[type=checkbox]').change(function () {
    if ($(this).get(0).checked) {
      amenities.push({ [$(this).attr('data-id')]: $(this).attr('data-name') });
    } else {
      for (let i = 0; i < amenities.length; i++) {
        if (Object.keys(amenities[i])[0] === $(this).attr('data-id')) {
          amenities.splice(i, 1);
          break;
        }
      }
    }
    const am = amenities.map((amenity) => Object.values(amenity)[0]).join(', ');
    if (amenities.length === 0) {
      $('.amenities h4').html('&nbsp;');
    } else {
      $('.amenities h4').text(am.length > 60 ? am.substr(0, 60) + '...' : am);
    }
  });
});
