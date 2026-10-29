/* CARs RS interactive features - front-end demo */
document.addEventListener("DOMContentLoaded", () => {
  const enquiryForm = document.querySelector(".enquiry-form");
  const params = new URLSearchParams(location.search);
  const selectedCar = params.get("car");
  if (selectedCar && enquiryForm) {
    const msg = enquiryForm.querySelector("#message");
    if (msg) msg.value = `I am interested in purchasing or viewing the ${selectedCar}. Please contact me with more information.`;
    const heading = document.createElement("p");
    heading.className = "selected-car-note";
    heading.textContent = `Vehicle selected: ${selectedCar}`;
    enquiryForm.prepend(heading);
  }

  const catalogue = document.querySelector("#catalogues");
  if (catalogue) {
    const tools = document.createElement("div");
    tools.className = "catalogue-tools";
    tools.innerHTML = `<div class="catalogue-search"><label for="carSearch">Find your next car</label><input id="carSearch" type="search" placeholder="Search by model or make" autocomplete="off"></div>
      <div class="catalogue-filter"><label for="carMake">Make</label><select id="carMake"><option value="all">All makes</option></select></div>
      <div class="catalogue-filter"><label for="carBudget">Maximum price</label><select id="carBudget"><option value="all">Any price</option><option value="1200000">Up to R 1,200,000</option><option value="1800000">Up to R 1,800,000</option><option value="2500000">Up to R 2,500,000</option></select></div>
      <div class="catalogue-filter"><label for="carSort">Sort by</label><select id="carSort"><option value="default">Featured</option><option value="name">Name (A–Z)</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div>
      <label class="saved-filter"><input id="savedOnly" type="checkbox"> Saved cars</label>
      <p id="carCount" aria-live="polite"></p>`;
    catalogue.before(tools);
    catalogue.classList.add("vehicle-grid");
    const savedCars = new Set(JSON.parse(localStorage.getItem("carsrs-saved") || "[]"));
    const cards = [...catalogue.querySelectorAll(".carbg")].map((card,index) => {
      const name=card.querySelector(".carname")?.textContent.trim() || "Vehicle";
      const price=card.querySelector(".carprice")?.textContent.trim() || "";
      const amount=Number(price.replace(/[^\d]/g,"")) || 0;
      const makeText=`${name} ${card.querySelector(".sellingcars")?.alt || ""}`.toLowerCase();
      const make=makeText.includes("bmw")?"bmw":makeText.includes("audi")?"audi":makeText.includes("mercedes")?"mercedes":makeText.includes("ferrari")?"ferrari":makeText.includes("porsche")?"porsche":makeText.includes("dodge")?"dodge":makeText.includes("toyota")||makeText.includes("supra")?"toyota":"other";
      card.dataset.name=name; card.dataset.price=amount; card.dataset.order=index; card.dataset.make=make;
      card.classList.add("vehicle-card");
      const makeSelect=tools.querySelector("#carMake");
      if (![...makeSelect.options].some(option=>option.value===make)) {
        const option=document.createElement("option"); option.value=make; option.textContent=make==="other"?"Other":make[0].toUpperCase()+make.slice(1); makeSelect.append(option);
      }
      const image=card.querySelector(".sellingcars");
      image.loading="lazy";
      const actions=document.createElement("div"); actions.className="vehicle-actions";
      const more=card.querySelector(".moreinfo");
      const buy=card.querySelector(".purchase");
      const save=document.createElement("button"); save.type="button"; save.className="save-car";
      save.setAttribute("aria-pressed",String(savedCars.has(name))); save.textContent=savedCars.has(name)?"Saved":"Save";
      actions.append(save,more,buy); card.append(actions);
      save.addEventListener("click",()=>{
        if(savedCars.has(name)){savedCars.delete(name);save.textContent="Save";save.setAttribute("aria-pressed","false");}
        else{savedCars.add(name);save.textContent="Saved";save.setAttribute("aria-pressed","true");}
        localStorage.setItem("carsrs-saved",JSON.stringify([...savedCars])); update();
      });
      more?.addEventListener("click",()=> {
        let detail=card.querySelector(".car-detail");
        if (!detail) {
          detail=document.createElement("p"); detail.className="car-detail";
          detail.textContent=`${name} is listed at ${price}. Contact CARs RS to confirm availability, specifications and viewing arrangements.`;
          card.append(detail);
          more.textContent="Hide Info";
        } else { detail.remove(); more.textContent="More Info"; }
      });
      buy?.addEventListener("click",()=> {
        location.href=`Enquiry.html?car=${encodeURIComponent(name)}&type=purchase`;
      });
      return card;
    });
    const search=tools.querySelector("#carSearch"), sort=tools.querySelector("#carSort");
    const make=tools.querySelector("#carMake"), budget=tools.querySelector("#carBudget"), savedOnly=tools.querySelector("#savedOnly");
    const update=()=>{
      const term=search.value.trim().toLowerCase();
      const maxPrice=budget.value==="all"?Infinity:Number(budget.value);
      let shown=cards.filter(c=>c.dataset.name.toLowerCase().includes(term)
        &&(make.value==="all"||c.dataset.make===make.value)
        &&Number(c.dataset.price)<=maxPrice
        &&(!savedOnly.checked||savedCars.has(c.dataset.name)));
      shown.sort((a,b)=>sort.value==="name"?a.dataset.name.localeCompare(b.dataset.name):sort.value==="low"?Number(a.dataset.price)-Number(b.dataset.price):sort.value==="high"?Number(b.dataset.price)-Number(a.dataset.price):Number(a.dataset.order)-Number(b.dataset.order));
      cards.forEach(c=>c.hidden=true);
      shown.forEach(c=>{c.hidden=false;catalogue.append(c);});
      tools.querySelector("#carCount").textContent=`${shown.length} ${shown.length===1?"vehicle":"vehicles"} available`;
      let empty=catalogue.querySelector("#noCars");
      if (!shown.length) { if(!empty){empty=document.createElement("p");empty.id="noCars";empty.textContent="No vehicles match those filters. Try changing your search.";catalogue.append(empty);} }
      else empty?.remove();
    };
    search.addEventListener("input",update); sort.addEventListener("change",update); make.addEventListener("change",update); budget.addEventListener("change",update); savedOnly.addEventListener("change",update); update();
  }

  if (enquiryForm) {
    enquiryForm.querySelectorAll("input,textarea").forEach(el=>el.required=true);
    enquiryForm.addEventListener("submit",event=>{
      event.preventDefault();
      if(!enquiryForm.reportValidity()) return;
      const data=Object.fromEntries(new FormData(enquiryForm).entries());
      const records=JSON.parse(localStorage.getItem("carsrs-enquiries")||"[]");
      records.push({...data,submittedAt:new Date().toISOString()});
      localStorage.setItem("carsrs-enquiries",JSON.stringify(records));
      enquiryForm.innerHTML=`<div class="success-message" role="status"><h3>Thank you, ${escapeHTML(data.name)}!</h3><p>Your enquiry has been saved in this browser. This demo website does not send it to the dealership. Please email <a href="mailto:carsrs@wheels.com">carsrs@wheels.com</a> to ensure the team receives it.</p><a class="action-link" href="vehicles.html">Browse more cars</a></div>`;
    });
  }

  const reviewSection=document.querySelector("#reviews");
  if(reviewSection){
    const saved=JSON.parse(localStorage.getItem("carsrs-reviews")||"[]");
    const list=document.createElement("div"); list.id="customerReviewList";
    saved.forEach(r=>list.append(makeReview(r)));
    reviewSection.append(list);
    const form=document.createElement("form"); form.className="review-form";
    form.innerHTML=`<h3>Leave a Review</h3><label for="reviewName">Your name</label><input id="reviewName" name="name" required maxlength="60" placeholder="Your name"><label for="reviewRating">Rating</label><select id="reviewRating" name="rating" required><option value="">Choose a rating</option><option value="5">★★★★★ - Excellent</option><option value="4">★★★★ - Very good</option><option value="3">★★★ - Good</option><option value="2">★★ - Fair</option><option value="1">★ - Poor</option></select><label for="reviewText">Your review</label><textarea id="reviewText" name="review" required maxlength="500" rows="4" placeholder="Share your experience"></textarea><button type="submit">Submit Review</button><p class="form-note">Reviews are saved in this browser for demonstration purposes.</p>`;
    reviewSection.append(form);
    form.addEventListener("submit",e=>{
      e.preventDefault(); if(!form.reportValidity())return;
      const r=Object.fromEntries(new FormData(form).entries());
      const items=JSON.parse(localStorage.getItem("carsrs-reviews")||"[]");items.unshift(r);
      localStorage.setItem("carsrs-reviews",JSON.stringify(items));
      list.prepend(makeReview(r));form.reset();
      const note=document.createElement("p");note.className="success-inline";note.textContent="Thank you! Your review has been added.";form.append(note);
    });
  }
  document.querySelectorAll('a[href^="mailto:"],a[href^="tel:"]').forEach(a=>a.setAttribute("rel","noopener"));
});
function makeReview(r){const b=document.createElement("blockquote");const stars="★".repeat(Number(r.rating)||0);const strong=document.createElement("strong");strong.textContent=`${r.name} · ${stars}`;const p=document.createElement("p");p.textContent=r.review;b.append(strong,p);return b;}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
