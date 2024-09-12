
// slideshow{}
let slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {            //Next/previous 
  showSlides((slideIndex += n));   // toán tử gán slideindex = slideindex + n
}

// function currentSlide(n) {  // Điều khiển hình ảnh
//   showSlides((slideIndex = n));
// }

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("bg-header fade");  //Dom đến class 
  if (n > slides.length) {  //Khi chạy hết slide thì quay về slide ban đầu
    slideIndex = 1;
  }
  if (n < 1) {    // Ban đầu khi control previous thì quay về slide cuối cùng 
    slideIndex = slides.length;
  }
  for (i = 0; i < slides.length; i++) {   //Sử dụng vòng lặp for để display none cái phần tử còn lại của mảng
    slides[i].style.display = "none";
  }
  slides[slideIndex - 1].style.display = "block";
}