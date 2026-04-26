# EA Widget Test Coverage

> **Last updated:** 2026-04-26
> **Plugin sources:**
> - Free: `ea-plugins/essential-addons-for-elementor-lite/includes/Elements/`
> - Pro:  `ea-plugins/essential-addons-elementor/includes/Elements/`

---

## Summary

| | Free | Pro | Total |
|---|---|---|---|
| Widgets | 60 | 41 | **101** |
| Covered | 22 | 6 | **28** |
| Not covered | 38 | 35 | **73** |
| **Coverage** | **37%** | **15%** | **28%** |

---

## ✅ Covered Widgets (27)

| Widget | Plugin | Test File |
|---|---|---|
| Advanced Accordion | Free | [tests/advanced-accordion.spec.ts](tests/advanced-accordion.spec.ts) |
| Career Page | Free | [tests/career-page.spec.ts](tests/career-page.spec.ts) |
| Countdown | Free | [tests/countdown.spec.ts](tests/countdown.spec.ts) |
| Image Accordion | Free | [tests/image-accordion.spec.ts](tests/image-accordion.spec.ts) |
| Image Comparison | Pro | [tests/image-comparison.spec.ts](tests/image-comparison.spec.ts) |
| Image Hot Spots | Pro | [tests/image-hot-spots.spec.ts](tests/image-hot-spots.spec.ts) |
| Advanced Menu | Pro | [tests/advanced-menu.spec.ts](tests/advanced-menu.spec.ts) |
| Advanced Tabs | Free | [tests/advanced-tabs.spec.ts](tests/advanced-tabs.spec.ts) |
| Breadcrumbs | Free | [tests/breadcrumbs.spec.ts](tests/breadcrumbs.spec.ts) |
| Code Snippet | Free | [tests/code-snippet.spec.ts](tests/code-snippet.spec.ts) |
| Counter | Pro | [tests/counter.spec.ts](tests/counter.spec.ts) |
| Price Menu | Pro | [tests/price-menu.spec.ts](tests/price-menu.spec.ts) |
| Pricing Slider | Pro | [tests/pricing-slider.spec.ts](tests/pricing-slider.spec.ts) |
| Creative Button | Free | [tests/creative-button.spec.ts](tests/creative-button.spec.ts) |
| CTA Box | Free | [tests/cta-box.spec.ts](tests/cta-box.spec.ts) |
| Dual Color Heading | Free | [tests/dual-color-heading.spec.ts](tests/dual-color-heading.spec.ts) |
| Fancy Text | Free | [tests/fancy-text.spec.ts](tests/fancy-text.spec.ts) |
| Feature List | Free | [tests/feature-list.spec.ts](tests/feature-list.spec.ts) |
| Filterable Gallery | Free | [tests/filterable-gallery.spec.ts](tests/filterable-gallery.spec.ts) |
| Flip Box | Free | [tests/flip-box.spec.ts](tests/flip-box.spec.ts) |
| Info Box | Free | [tests/info-box.spec.ts](tests/info-box.spec.ts) |
| Progress Bar | Free | [tests/progress-bar.spec.ts](tests/progress-bar.spec.ts) |
| Simple Menu | Free | [tests/simple-menu.spec.ts](tests/simple-menu.spec.ts) |
| Content Ticker | Free | [tests/content-ticker.spec.ts](tests/content-ticker.spec.ts) |
| SVG Draw | Free | [tests/svg-draw.spec.ts](tests/svg-draw.spec.ts) |
| Team Member | Free | [tests/team-member.spec.ts](tests/team-member.spec.ts) |
| Testimonial | Free | [tests/testimonial.spec.ts](tests/testimonial.spec.ts) |
| Tooltip | Free | [tests/tooltip.spec.ts](tests/tooltip.spec.ts) |

---

## ❌ Not Covered — Free Widgets (39)

### Core / General

| Widget | PHP File |
|---|---|
| Advanced Data Table | `Advanced_Data_Table.php` |
| Business Reviews | `Business_Reviews.php` |
~~| Countdown | `Countdown.php` |~~
| Data Table | `Data_Table.php` |
| Interactive Circle | `Interactive_Circle.php` |
| Login / Register | `Login_Register.php` |
| NFT Gallery | `NFT_Gallery.php` |
| Post Grid | `Post_Grid.php` |
| Post Timeline | `Post_Timeline.php` |
| Pricing Table | `Pricing_Table.php` |
~~| SVG Draw | `SVG_Draw.php` |~~
| Sticky Video | `Sticky_Video.php` |
~~| Team Member | `Team_Member.php` |~~
| Twitter Feed | `Twitter_Feed.php` |

### Form Integrations

| Widget | PHP File |
|---|---|
| Caldera Forms | `Caldera_Forms.php` |
| Contact Form 7 | `Contact_Form_7.php` |
| Fluent Form | `FluentForm.php` |
| Formstack | `Formstack.php` |
| Gravity Forms | `GravityForms.php` |
| Ninja Forms | `NinjaForms.php` |
| TypeForm | `TypeForm.php` |
| WeForms | `WeForms.php` |
| WP Forms | `WpForms.php` |

### WooCommerce

| Widget | PHP File |
|---|---|
| Woo Add To Cart | `Woo_Add_To_Cart.php` |
| Woo Cart | `Woo_Cart.php` |
| Woo Checkout | `Woo_Checkout.php` |
| Woo Product Carousel | `Woo_Product_Carousel.php` |
| Woo Product Compare | `Woo_Product_Compare.php` |
| Woo Product Gallery | `Woo_Product_Gallery.php` |
| Woo Product Images | `Woo_Product_Images.php` |
| Woo Product List | `Woo_Product_List.php` |
| Woo Product Price | `Woo_Product_Price.php` |
| Woo Product Rating | `Woo_Product_Rating.php` |
| Product Grid | `Product_Grid.php` |

### Third-party Integrations

| Widget | PHP File |
|---|---|
| Better Payment | `Better_Payment.php` |
| BetterDocs Category Box | `Betterdocs_Category_Box.php` |
| BetterDocs Category Grid | `Betterdocs_Category_Grid.php` |
| BetterDocs Search Form | `Betterdocs_Search_Form.php` |
| EmbedPress | `EmbedPress.php` |
| Event Calendar | `Event_Calendar.php` |
| Facebook Feed | `Facebook_Feed.php` |

---

## ❌ Not Covered — Pro Widgets (35)

### Core / General

| Widget | PHP File |
|---|---|
| Advanced Search | `Advanced_Search.php` |
| Content Timeline | `Content_Timeline.php` |
| Divider | `Divider.php` |
| Dynamic Filterable Gallery | `Dynamic_Filterable_Gallery.php` |
| Fancy Chart | `Fancy_Chart.php` |
| Figma To Elementor | `Figma_To_Elementor.php` |
| Flip Carousel | `Flip_Carousel.php` |
| Google Map | `Google_Map.php` |
| Image Scroller | `Image_Scroller.php` |
| Interactive Card | `Interactive_Card.php` |
| Interactive Promo | `Interactive_Promo.php` |
| Lightbox | `Lightbox.php` |
| Logo Carousel | `Logo_Carousel.php` |
| Multicolumn Pricing Table | `Multicolumn_Pricing_Table.php` |
| Offcanvas | `Offcanvas.php` |
| One Page Navigation | `One_Page_Navigation.php` |
| Post Block | `Post_Block.php` |
| Post Carousel | `Post_Carousel.php` |
| Post List | `Post_List.php` |
~~| Price Menu | `Price_Menu.php` |~~
| Protected Content | `Protected_Content.php` |
| Sphere Photo Viewer | `Sphere_Photo_Viewer.php` |
| Stacked Cards | `Stacked_Cards.php` |
| Static Product | `Static_Product.php` |
| Team Member Carousel | `Team_Member_Carousel.php` |
| Testimonial Slider | `Testimonial_Slider.php` |
| Toggle | `Toggle.php` |
| Twitter Feed Carousel | `Twitter_Feed_Carousel.php` |

### Third-party Integrations (Pro)

| Widget | PHP File |
|---|---|
| Instagram Feed | `Instagram_Feed.php` |
| LD Course List | `LD_Course_List.php` |
| Mailchimp | `Mailchimp.php` |

### WooCommerce (Pro)

| Widget | PHP File |
|---|---|
| Woo Account Dashboard | `Woo_Account_Dashboard.php` |
| Woo Collections | `Woo_Collections.php` |
| Woo Cross Sells | `Woo_Cross_Sells.php` |
| Woo Product Slider | `Woo_Product_Slider.php` |
| Woo Thank You | `Woo_Thank_You.php` |

---

## How to Update This File

নতুন widget এর test যোগ করলে:

1. **Covered** — widget টি "✅ Covered Widgets" table এ যোগ করো (alphabetical order), test file লিংকসহ।
2. **Not covered table** — সেই widget এর row টি "❌ Not Covered" section থেকে মুছে দাও।
3. **Summary counters** আপডেট করো (covered ও not covered সংখ্যা)।

নতুন widget EA plugin এ যোগ হলে:
1. "❌ Not Covered" section এ সঠিক category তে যোগ করো।
2. Summary এর Total এবং "Not covered" count বাড়াও।
