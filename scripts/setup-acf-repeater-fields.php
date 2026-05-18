<?php
/**
 * Sets up ACF Repeater field groups for EA widget testing:
 * - Testimonial Slider
 * - Price Menu
 * - Team Member Carousel
 */

if ( ! function_exists( 'acf_add_local_field_group' ) ) {
    WP_CLI::error( 'ACF Pro is not active.' );
    return;
}

// ── 1. Testimonial Slider ─────────────────────────────────────────────────────
acf_add_local_field_group( [
    'key'      => 'group_ea_testimonial_slider',
    'title'    => 'EA Testimonial Slider Data',
    'fields'   => [
        [
            'key'          => 'field_ts_repeater',
            'label'        => 'Testimonials',
            'name'         => 'ea_ts_repeater',
            'type'         => 'repeater',
            'min'          => 0,
            'layout'       => 'block',
            'sub_fields'   => [
                [ 'key' => 'field_ts_name',        'label' => 'Name',        'name' => 'name',        'type' => 'text'     ],
                [ 'key' => 'field_ts_company',     'label' => 'Company',     'name' => 'company',     'type' => 'text'     ],
                [ 'key' => 'field_ts_description', 'label' => 'Description', 'name' => 'description', 'type' => 'textarea' ],
                [ 'key' => 'field_ts_rating',      'label' => 'Rating',      'name' => 'rating',      'type' => 'number', 'min' => 0, 'max' => 5 ],
                [ 'key' => 'field_ts_avatar',      'label' => 'Avatar',      'name' => 'avatar',      'type' => 'image', 'return_format' => 'array' ],
            ],
        ],
    ],
    'location' => [ [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'page' ] ] ],
    'active'   => true,
] );

// ── 2. Price Menu ─────────────────────────────────────────────────────────────
acf_add_local_field_group( [
    'key'      => 'group_ea_price_menu',
    'title'    => 'EA Price Menu Data',
    'fields'   => [
        [
            'key'        => 'field_pm_repeater',
            'label'      => 'Price Menu Items',
            'name'       => 'ea_pm_repeater',
            'type'       => 'repeater',
            'min'        => 0,
            'layout'     => 'block',
            'sub_fields' => [
                [ 'key' => 'field_pm_title',          'label' => 'Title',          'name' => 'title',          'type' => 'text'     ],
                [ 'key' => 'field_pm_description',    'label' => 'Description',    'name' => 'description',    'type' => 'textarea' ],
                [ 'key' => 'field_pm_price',          'label' => 'Price',          'name' => 'price',          'type' => 'text'     ],
                [ 'key' => 'field_pm_original_price', 'label' => 'Original Price', 'name' => 'original_price', 'type' => 'text'     ],
                [ 'key' => 'field_pm_image',          'label' => 'Image',          'name' => 'image',          'type' => 'image', 'return_format' => 'array' ],
            ],
        ],
    ],
    'location' => [ [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'page' ] ] ],
    'active'   => true,
] );

// ── 3. Team Member Carousel ───────────────────────────────────────────────────
acf_add_local_field_group( [
    'key'      => 'group_ea_team_member_carousel',
    'title'    => 'EA Team Member Carousel Data',
    'fields'   => [
        [
            'key'        => 'field_tmc_repeater',
            'label'      => 'Team Members',
            'name'       => 'ea_tmc_repeater',
            'type'       => 'repeater',
            'min'        => 0,
            'layout'     => 'block',
            'sub_fields' => [
                [ 'key' => 'field_tmc_name',        'label' => 'Name',        'name' => 'name',        'type' => 'text'  ],
                [ 'key' => 'field_tmc_position',    'label' => 'Position',    'name' => 'position',    'type' => 'text'  ],
                [ 'key' => 'field_tmc_description', 'label' => 'Description', 'name' => 'description', 'type' => 'textarea' ],
                [ 'key' => 'field_tmc_image',       'label' => 'Image',       'name' => 'image',       'type' => 'image', 'return_format' => 'array' ],
                [ 'key' => 'field_tmc_image_url',   'label' => 'Link URL',    'name' => 'image_url',   'type' => 'url'   ],
                [ 'key' => 'field_tmc_mail',        'label' => 'Mail Address','name' => 'mail',        'type' => 'email' ],
            ],
        ],
    ],
    'location' => [ [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'page' ] ] ],
    'active'   => true,
] );

// ── 4. Create a test page and populate with sample data ───────────────────────
$page_id = get_page_by_path( 'acf-repeater-test-data' );
$page_id = $page_id ? $page_id->ID : wp_insert_post( [
    'post_title'  => 'ACF Repeater Test Data',
    'post_name'   => 'acf-repeater-test-data',
    'post_status' => 'publish',
    'post_type'   => 'page',
] );

// Testimonial Slider rows
update_field( 'ea_ts_repeater', [
    [ 'name' => 'Alice Johnson',  'company' => 'TechCorp',   'description' => 'Absolutely amazing product! Highly recommend it to everyone.', 'rating' => 5, 'avatar' => null ],
    [ 'name' => 'Bob Smith',      'company' => 'DesignHub',  'description' => 'Great experience overall. The support team was very helpful.',   'rating' => 4, 'avatar' => null ],
    [ 'name' => 'Carol Williams', 'company' => 'StartupXYZ', 'description' => 'Good product but there is room for improvement in some areas.',  'rating' => 3, 'avatar' => null ],
], $page_id );

// Price Menu rows
update_field( 'ea_pm_repeater', [
    [ 'title' => 'Margherita Pizza',  'description' => 'Classic tomato and mozzarella',     'price' => '$12.99', 'original_price' => '$15.99', 'image' => null ],
    [ 'title' => 'Caesar Salad',      'description' => 'Fresh romaine with Caesar dressing', 'price' => '$8.99',  'original_price' => '',        'image' => null ],
    [ 'title' => 'Grilled Salmon',    'description' => 'With lemon butter and seasonal veg', 'price' => '$22.99', 'original_price' => '$27.99', 'image' => null ],
    [ 'title' => 'Chocolate Fondant', 'description' => 'Warm chocolate cake with ice cream', 'price' => '$7.50',  'original_price' => '',        'image' => null ],
], $page_id );

// Team Member Carousel rows
update_field( 'ea_tmc_repeater', [
    [ 'name' => 'James Carter',  'position' => 'CEO',             'description' => 'Visionary leader with 15 years of industry experience.', 'image' => null, 'image_url' => 'https://example.com/james',  'mail' => 'james@example.com'  ],
    [ 'name' => 'Sarah Lee',     'position' => 'Lead Designer',   'description' => 'Creative mind behind all our award-winning UI work.',    'image' => null, 'image_url' => 'https://example.com/sarah',  'mail' => 'sarah@example.com'  ],
    [ 'name' => 'Mike Nguyen',   'position' => 'CTO',             'description' => 'Full-stack architect passionate about clean code.',       'image' => null, 'image_url' => 'https://example.com/mike',   'mail' => 'mike@example.com'   ],
    [ 'name' => 'Emily Brown',   'position' => 'Marketing Head',  'description' => 'Data-driven marketer who grows brands strategically.',    'image' => null, 'image_url' => 'https://example.com/emily',  'mail' => 'emily@example.com'  ],
], $page_id );

WP_CLI::success( "ACF field groups registered and test page populated (Page ID: {$page_id})" );
WP_CLI::log( "Test page: " . get_permalink( $page_id ) );
WP_CLI::log( "Testimonial rows: " . count( get_field( 'ea_ts_repeater', $page_id ) ?? [] ) );
WP_CLI::log( "Price Menu rows:  " . count( get_field( 'ea_pm_repeater', $page_id ) ?? [] ) );
WP_CLI::log( "Team Member rows: " . count( get_field( 'ea_tmc_repeater', $page_id ) ?? [] ) );
