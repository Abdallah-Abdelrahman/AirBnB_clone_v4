/* global $ */
$(document).ready(function () {
  const amenities = [];

  $('input[type=checkbox]').change(function () {
    const amenityId = $(this).attr('data-id');
    const amenityName = $(this).attr('data-name');

    if (this.checked) {
      amenities.push({ [amenityId]: amenityName });
    } else {
      amenities.splice(
        amenities.findIndex((amenity) => Object.keys(amenity)[0] === amenityId),
        1
      );
    }

    updateAmenitiesText();
  });

  function updateAmenitiesText () {
    const amenityNames = amenities.map((amenity) => Object.values(amenity)[0]);
    const text = amenityNames.join(', ');

    if (amenityNames.length === 0) {
      $('.amenities h4').html('&nbsp;');
    } else {
      $('.amenities h4').text(
        text.length > 60 ? `${text.substr(0, 60)}...` : text
      );
      $('.amenities h4').css('white-space', 'nowrap');
    }
  }
});
