# Graph Report - .  (2026-05-03)

## Corpus Check
- Corpus is ~29,891 words - fits in a single context window. You may not need a graph.

## Summary
- 580 nodes · 782 edges · 48 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.82)
- Token cost: 1,850 input · 980 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Global UI Components|Global UI Components]]
- [[_COMMUNITY_Modal & Drawer Interactions|Modal & Drawer Interactions]]
- [[_COMMUNITY_Cart & Product Info|Cart & Product Info]]
- [[_COMMUNITY_Scroll Animations|Scroll Animations]]
- [[_COMMUNITY_Quick Order List|Quick Order List]]
- [[_COMMUNITY_Cart Items Core|Cart Items Core]]
- [[_COMMUNITY_Slider & Slideshow|Slider & Slideshow]]
- [[_COMMUNITY_Predictive Search|Predictive Search]]
- [[_COMMUNITY_Theme Documentation|Theme Documentation]]
- [[_COMMUNITY_E-commerce & Brand Icons|E-commerce & Brand Icons]]
- [[_COMMUNITY_Bloomli Cart Drawer|Bloomli Cart Drawer]]
- [[_COMMUNITY_Bulk Quick Add|Bulk Quick Add]]
- [[_COMMUNITY_Localization Form|Localization Form]]
- [[_COMMUNITY_Dietary & Promo Icons|Dietary & Promo Icons]]
- [[_COMMUNITY_Cart Drawer|Cart Drawer]]
- [[_COMMUNITY_Recipient Gift Form|Recipient Gift Form]]
- [[_COMMUNITY_Media Gallery|Media Gallery]]
- [[_COMMUNITY_Cart Notification|Cart Notification]]
- [[_COMMUNITY_Bulk Add Component|Bulk Add Component]]
- [[_COMMUNITY_Quick Add Modal|Quick Add Modal]]
- [[_COMMUNITY_Lifestyle & Product Icons|Lifestyle & Product Icons]]
- [[_COMMUNITY_Details Disclosure|Details Disclosure]]
- [[_COMMUNITY_Social Media Icons|Social Media Icons]]
- [[_COMMUNITY_Main Search|Main Search]]
- [[_COMMUNITY_Price Per Item|Price Per Item]]
- [[_COMMUNITY_Product & Ingredient Icons|Product & Ingredient Icons]]
- [[_COMMUNITY_Customer Addresses|Customer Addresses]]
- [[_COMMUNITY_Image Magnifier|Image Magnifier]]
- [[_COMMUNITY_Quantity Input|Quantity Input]]
- [[_COMMUNITY_Before After Slider|Before After Slider]]
- [[_COMMUNITY_Bloomli Theme Accordion|Bloomli Theme Accordion]]
- [[_COMMUNITY_Product Modal|Product Modal]]
- [[_COMMUNITY_Bloomli FAQ|Bloomli FAQ]]
- [[_COMMUNITY_Core Shopping Icons|Core Shopping Icons]]
- [[_COMMUNITY_Navigation Icons|Navigation Icons]]
- [[_COMMUNITY_UI Status Icons|UI Status Icons]]
- [[_COMMUNITY_Laundry Care Icons|Laundry Care Icons]]
- [[_COMMUNITY_UI Action Icons|UI Action Icons]]
- [[_COMMUNITY_Apparel & Sizing Icons|Apparel & Sizing Icons]]
- [[_COMMUNITY_Product Care Icons|Product Care Icons]]
- [[_COMMUNITY_Email Banner Assets|Email Banner Assets]]
- [[_COMMUNITY_Direction Icons|Direction Icons]]
- [[_COMMUNITY_Checkmark Icons|Checkmark Icons]]
- [[_COMMUNITY_Copy Icons|Copy Icons]]
- [[_COMMUNITY_Close Icons|Close Icons]]
- [[_COMMUNITY_Media Controls|Media Controls]]
- [[_COMMUNITY_Pinterest & Share|Pinterest & Share]]
- [[_COMMUNITY_Shipping & Returns|Shipping & Returns]]

## God Nodes (most connected - your core abstractions)
1. `PredictiveSearch` - 23 edges
2. `FacetFiltersForm` - 20 edges
3. `CartItems` - 16 edges
4. `SlideshowComponent` - 16 edges
5. `Dawn Theme` - 14 edges
6. `CartDrawer` - 11 edges
7. `MenuDrawer` - 11 edges
8. `BulkAdd` - 10 edges
9. `CartNotification` - 9 edges
10. `removeTrapFocus()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `connectedCallback()` --calls--> `subscribe()`  [INFERRED]
  price-per-item.js → pubsub.js
- `constructor()` --calls--> `debounce()`  [INFERRED]
  cart.js → global.js
- `show()` --calls--> `trapFocus()`  [INFERRED]
  pickup-availability.js → global.js
- `constructor()` --calls--> `debounce()`  [INFERRED]
  media-gallery.js → global.js
- `constructor()` --calls--> `debounce()`  [INFERRED]
  quick-add-bulk.js → global.js

## Hyperedges (group relationships)
- **CI Quality Pipeline: GitHub Actions, Lighthouse CI, Theme Check Action** — readme_github_actions, readme_lighthouse_ci_action, readme_theme_check_action [EXTRACTED 1.00]
- **Dawn Core Design Principles: HTML-First, Progressive Enhancement, Server-Rendered** — readme_html_first_approach, readme_progressive_enhancement, readme_server_rendered [EXTRACTED 1.00]
- **Translation Ownership: Buyer Component, Merchant Component, Themes Translations Team** — translation_buyer_component, translation_merchant_component, translation_themes_translations_team [EXTRACTED 1.00]
- **Email Signup Banner Backgrounds** — email_signup_banner_background_mobile_bg, email_signup_banner_background_bg [EXTRACTED 1.00]
- **Food & Ingredient Icons (Supplement Flavor/Ingredient Indicators)** — icon_apple_icon, icon_banana_icon, icon_carrot_icon [INFERRED 0.95]
- **Dietary & Ingredient Badge Icons** — icon_dairy_icon, icon_dairy_free_icon [INFERRED 0.95]
- **Product Container Icons (Supplement Packaging)** — icon_bottle_icon, icon_box_icon [INFERRED 0.85]
- **UI Navigation Icons** — icon_arrow_icon, icon_caret_icon [INFERRED 0.95]
- **UI Dismiss / Close Icons** — icon_close_icon, icon_close_small_icon [INFERRED 0.95]
- **UI Confirmation / Success Icons** — icon_check_mark_icon, icon_checkmark_icon [INFERRED 0.95]
- **UI Copy / Clipboard Icons** — icon_clipboard_icon, icon_copy_icon [INFERRED 0.85]
- **E-Commerce Core UI Icons** — icon_account_icon, icon_cart_icon, icon_cart_empty_icon, icon_chat_bubble_icon [INFERRED 0.95]
- **Accordion / Expandable Section Icons** — icon_apple_icon, icon_banana_icon, icon_bottle_icon, icon_box_icon, icon_carrot_icon, icon_chat_bubble_icon, icon_check_mark_icon, icon_clipboard_icon, icon_dairy_icon, icon_dairy_free_icon [EXTRACTED 1.00]
- **All Chunk 02 Theme Assets** — email_signup_banner_background_mobile_bg, email_signup_banner_background_bg, icon_3d_model_icon, icon_account_icon, icon_apple_icon, icon_arrow_icon, icon_banana_icon, icon_bottle_icon, icon_box_icon, icon_caret_icon, icon_carrot_icon, icon_cart_empty_icon, icon_cart_icon, icon_chat_bubble_icon, icon_check_mark_icon, icon_checkmark_icon, icon_clipboard_icon, icon_close_small_icon, icon_close_icon, icon_copy_icon, icon_dairy_free_icon, icon_dairy_icon [EXTRACTED 1.00]
- **Dietary and Allergen Claim Badge Icons** — icon-gluten-free_gluten_free, icon-nut-free_nut_free, icon-leaf_leaf [INFERRED 0.95]
- **Social Media Share Icons Group** — icon-facebook_facebook, icon-instagram_instagram [INFERRED 0.95]
- **UI Status and Feedback Icons Group** — icon-error_error, icon-info_info, icon-inventory-status_inventory_status [INFERRED 0.95]
- **Laundry and Material Care Icons Group** — icon-dryer_dryer, icon-iron_iron, icon-leather_leather [INFERRED 0.85]
- **Product Marketing and Energy Claim Icons** — icon-fire_fire, icon-lightning-bolt_lightning_bolt, icon-discount_discount, icon-lipstick_lipstick [INFERRED 0.75]
- **E-commerce Shopper Action Icons** — icon-heart_heart, icon-lock_lock, icon-minus_minus, icon-eye_eye, icon-filter_filter, icon-hamburger_hamburger [INFERRED 0.85]
- **Location and Navigation Icons** — icon-map-pin_map_pin, icon-hamburger_hamburger [INFERRED 0.75]
- **Apparel / Clothing Icons** — icon-pants_apparel, icon-shirt_apparel, icon-ruler_sizing [INFERRED 0.95]
- **Media Control Icons** — icon-play_media, icon-pause_media [EXTRACTED 1.00]
- **Social Media and Sharing Icons** — icon-pinterest_social, icon-share_social [EXTRACTED 1.00]
- **UI Control and Action Icons** — icon-plus_ui, icon-remove_ui, icon-reset_ui, icon-search_ui, icon-question-mark_ui [INFERRED 0.95]
- **Ecommerce and Shopping Icons** — icon-padlock_security, icon-price-tag_ecommerce, icon-return_ecommerce, icon-plane_shipping [INFERRED 0.95]
- **Nature and Sustainability Icons** — icon-plant_nature, icon-recycle_sustainability, icon-paw-print_pet [INFERRED 0.85]
- **Food and Ingredient Icons** — icon-pepper_food, icon-serving-dish_food [INFERRED 0.85]
- **Beauty and Lifestyle Product Icons** — icon-perfume_beauty, icon-paw-print_pet [INFERRED 0.65]
- **Accordion UI Class Icons** — icon-pants_apparel, icon-paw-print_pet, icon-pepper_food, icon-perfume_beauty, icon-plane_shipping, icon-plant_nature, icon-price-tag_ecommerce, icon-question-mark_ui, icon-recycle_sustainability, icon-return_ecommerce, icon-ruler_sizing, icon-serving-dish_food, icon-shirt_apparel [EXTRACTED 1.00]
- **Social Media Icons: Snapchat, TikTok, Tumblr, Twitter, Vimeo, YouTube** — icon_snapchat, icon_tiktok, icon_tumblr, icon_twitter, icon_vimeo, icon_youtube, category_social_media_icons [INFERRED 0.95]
- **UI Feedback Icons: Success, Tick, Unavailable, Star, Loading Spinner** — icon_success, icon_tick, icon_unavailable, icon_star, loading_spinner, category_ui_feedback_icons [INFERRED 0.95]
- **E-Commerce Icons: Shoe, Shopify, Silhouette, Truck, Zoom, Star, Stopwatch** — icon_shoe, icon_shopify, icon_silhouette, icon_truck, icon_zoom, icon_star, icon_stopwatch, category_ecommerce_icons [INFERRED 0.85]
- **Product Care Icons: Washing, Snowflake** — icon_washing, icon_snowflake, category_product_care_icons [INFERRED 0.85]
- **UI Shapes / Structural Elements: Mask Arch, Square, Sparkle GIF, Loading Spinner, Zoom** — mask_arch, square, sparkle_gif, loading_spinner, icon_zoom, category_ui_shapes [INFERRED 0.85]
- **Platform Branding: Shopify Logo** — icon_shopify, category_platform_branding [EXTRACTED 1.00]

## Communities (55 total, 18 thin omitted)

### Community 0 - "Global UI Components"
Cohesion: 0.05
Nodes (11): AccountIcon, BulkModal, CartPerformance, DeferredMedia, HTMLUpdateUtility, ModalDialog, ModalOpener, pauseAllMedia() (+3 more)

### Community 1 - "Modal & Drawer Interactions"
Cohesion: 0.08
Nodes (13): DetailsModal, getFocusableElements(), HeaderDrawer, MenuDrawer, removeTrapFocus(), trapFocus(), constructor(), fetchAvailability() (+5 more)

### Community 2 - "Cart & Product Info"
Cohesion: 0.08
Nodes (15): buildRequestUrlWithParams(), connectedCallback(), handleOptionValueChange(), handleSwapProduct(), handleUpdateProductInfo(), initializeProductSwapUtility(), initQuantityHandlers(), renderProductInfo() (+7 more)

### Community 3 - "Scroll Animations"
Cohesion: 0.09
Nodes (4): initializeScrollAnimationTrigger(), FacetFiltersForm, FacetRemove, PriceRange

### Community 4 - "Quick Order List"
Cohesion: 0.1
Nodes (21): cleanErrorMessageOnType(), connectedCallback(), constructor(), getSectionsToRender(), getTotalBar(), handleScrollIntoView(), handleSwitchVariantOnEnter(), initEventListeners() (+13 more)

### Community 5 - "Cart Items Core"
Cohesion: 0.1
Nodes (5): CartItems, CartRemoveButton, constructor(), debounce(), SearchForm

### Community 8 - "Theme Documentation"
Cohesion: 0.14
Nodes (19): Shopify Dawn License, Contributing Guide, Dawn Theme, GitHub Actions CI, HTML-First JavaScript-Only-As-Needed Approach, Shopify Lighthouse CI Action, Online Store 2.0, Progressive Enhancement (+11 more)

### Community 9 - "E-commerce & Brand Icons"
Cohesion: 0.14
Nodes (18): E-Commerce / Shopping Icons Group, Platform Branding Icons Group, UI Feedback Icons Group, UI Shapes / Structural Elements Group, Shoe Icon, Shopify Logo Icon, Person Silhouette / User Account Icon, Star / Rating Icon (+10 more)

### Community 10 - "Bloomli Cart Drawer"
Cohesion: 0.21
Nodes (11): closeFrequencyMenus(), getSectionInnerHTML(), getSections(), replaceCartSections(), setFrequencyDisplay(), setMenuOpen(), updateFrequency(), updateLineQuantity() (+3 more)

### Community 11 - "Bulk Quick Add"
Cohesion: 0.23
Nodes (8): constructor(), getSectionsToRender(), getSectionsUrl(), listenForActiveInput(), listenForKeydown(), renderSections(), selectProgressBar(), updateMultipleQty()

### Community 12 - "Localization Form"
Cohesion: 0.21
Nodes (7): closeSelector(), filterCountries(), hidePanel(), normalizeString(), onContainerKeyUp(), openSelector(), resetFilter()

### Community 13 - "Dietary & Promo Icons"
Cohesion: 0.21
Nodes (14): Dietary / Allergen Claim Icons, E-commerce Action / Interaction Icons, Product / Marketing Claim Icons, Discount / Price Tag Icon, Eye / Visibility Icon, Fire / Trending / Hot Icon, Gluten-Free Dietary Badge Icon, Heart / Wishlist / Favourite Icon (+6 more)

### Community 15 - "Recipient Gift Form"
Cohesion: 0.31
Nodes (10): clearErrorMessage(), clearInputFields(), constructor(), disableableFields(), disableInputFields(), displayErrorMessage(), enableInputFields(), inputFields() (+2 more)

### Community 16 - "Media Gallery"
Cohesion: 0.29
Nodes (8): announceLiveRegion(), constructor(), onSlideChanged(), playActiveMedia(), preventStickyHeader(), removeListSemantic(), setActiveMedia(), setActiveThumbnail()

### Community 19 - "Quick Add Modal"
Cohesion: 0.31
Nodes (6): preprocessHTML(), preventDuplicatedIDs(), preventVariantURLSwitching(), removeDOMElements(), removeGalleryListSemantic(), updateImageSizes()

### Community 20 - "Lifestyle & Product Icons"
Cohesion: 0.2
Nodes (10): Padlock Icon, Paw Print Icon, Pepper Icon, Perfume Bottle Icon, Plant / Leaf Icon, Price Tag Icon, Question Mark / Help Icon, Recycle Icon (+2 more)

### Community 22 - "Social Media Icons"
Cohesion: 0.25
Nodes (9): Social Media Share Icons, Facebook Social Media Icon, Instagram Social Media Icon, Snapchat Social Media Icon, TikTok Social Media Icon, Tumblr Social Media Icon, Twitter / X Social Media Icon, Vimeo Social Media Icon (+1 more)

### Community 24 - "Price Per Item"
Cohesion: 0.36
Nodes (6): connectedCallback(), constructor(), getCartQuantity(), getVolumePricingArray(), onInputChange(), updatePricePerItem()

### Community 25 - "Product & Ingredient Icons"
Cohesion: 0.29
Nodes (8): Icon: 3D Model, Icon: Apple (Fruit), Icon: Banana (Fruit), Icon: Bottle (Supplement Container), Icon: Box (3D Package), Icon: Carrot (Vegetable), Icon: Dairy Free (Badge/Dietary Label), Icon: Dairy (Milk Jug/Bottle Badge)

### Community 27 - "Image Magnifier"
Cohesion: 0.43
Nodes (4): createOverlay(), magnify(), prepareOverlay(), toggleLoadingSpinner()

### Community 29 - "Before After Slider"
Cohesion: 0.6
Nodes (4): clamp(), initSection(), update(), updateFromPointer()

### Community 32 - "Bloomli Theme Accordion"
Cohesion: 0.6
Nodes (3): closeAccordion(), initAccordions(), openAccordion()

### Community 35 - "Bloomli FAQ"
Cohesion: 0.83
Nodes (3): finishAfterTransition(), initFaq(), setPanelState()

### Community 37 - "Core Shopping Icons"
Cohesion: 0.5
Nodes (4): Icon: Account (User Profile), Icon: Cart Empty, Icon: Cart (Shopping Bag), Icon: Chat Bubble (Message/Support)

### Community 38 - "Navigation Icons"
Cohesion: 0.5
Nodes (4): UI Navigation Icons, Filter / Sort Controls Icon, Hamburger / Navigation Menu Icon, Map Pin / Location Icon

### Community 39 - "UI Status Icons"
Cohesion: 0.83
Nodes (4): UI Status / Feedback Icons, Error / Alert Status Icon, Info / Tooltip Icon, Inventory / Stock Status Indicator Icon

### Community 40 - "Laundry Care Icons"
Cohesion: 0.67
Nodes (4): Laundry / Material Care Icons, Dryer / Laundry Care Icon, Iron / Laundry Care Icon, Leather / Material Care Icon

### Community 42 - "UI Action Icons"
Cohesion: 1.0
Nodes (3): Plus / Add Icon, Remove / Trash Icon, Reset / Close Icon

### Community 43 - "Apparel & Sizing Icons"
Cohesion: 1.0
Nodes (3): Pants Icon, Ruler / Measurement Icon, Shirt / T-Shirt Icon

### Community 44 - "Product Care Icons"
Cohesion: 1.0
Nodes (3): Product / Care Instructions Icons Group, Snowflake / Cold Storage Icon, Washing / Care Instructions Icon

## Ambiguous Edges - Review These
- `Shoe Icon` → `Arch Shape Clip Path Mask`  [AMBIGUOUS]
  assets/mask-arch.svg · relation: conceptually_related_to

## Knowledge Gaps
- **47 isolated node(s):** `Shopify Dawn License`, `Online Store 2.0`, `Progressive Enhancement`, `Shopify CLI`, `Shopify Theme Store` (+42 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Shoe Icon` and `Arch Shape Clip Path Mask`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `debounce()` connect `Cart Items Core` to `Global UI Components`, `Media Gallery`, `Bulk Quick Add`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `subscribe()` connect `Cart & Product Info` to `Price Per Item`, `Quantity Input`, `Quick Order List`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `fetchConfig()` connect `Bloomli Cart Drawer` to `Global UI Components`, `Bulk Quick Add`, `Quick Order List`, `Cart Items Core`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `Shopify Dawn License`, `Online Store 2.0`, `Progressive Enhancement` to the rest of the system?**
  _47 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Global UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Modal & Drawer Interactions` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._