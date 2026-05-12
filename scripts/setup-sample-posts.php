<?php
/**
 * Seed sample WordPress posts for EA post-related widget testing
 * (Post Block, Post Grid, Post Carousel, etc.)
 * Run via: wp eval-file /scripts/setup-sample-posts.php
 */

WP_CLI::log( '' );
WP_CLI::log( '--- Sample Posts ---' );

require_once __DIR__ . '/helpers-sample-data.php';

// - helpers ----------------------------------

function ea_get_or_create_category( string $name, string $slug ): int {
    $term = get_term_by( 'slug', $slug, 'category' );
    if ( $term ) return (int) $term->term_id;
    $result = wp_insert_term( $name, 'category', [ 'slug' => $slug ] );
    if ( is_wp_error( $result ) ) WP_CLI::error( $result->get_error_message() );
    WP_CLI::log( "  category created: {$name}" );
    return (int) $result['term_id'];
}

function ea_get_or_create_tag( string $name, string $slug ): int {
    $term = get_term_by( 'slug', $slug, 'post_tag' );
    if ( $term ) return (int) $term->term_id;
    $result = wp_insert_term( $name, 'post_tag', [ 'slug' => $slug ] );
    if ( is_wp_error( $result ) ) WP_CLI::error( $result->get_error_message() );
    return (int) $result['term_id'];
}

function ea_post_exists( string $slug ): bool {
    return (bool) get_page_by_path( $slug, OBJECT, 'post' );
}

function ea_create_post( array $data ): int {
    if ( ea_post_exists( $data['slug'] ) ) {
        $post = get_page_by_path( $data['slug'], OBJECT, 'post' );
        WP_CLI::log( "  exists : {$data['title']} (ID {$post->ID})" );
        return (int) $post->ID;
    }

    $id = wp_insert_post( [
        'post_type'    => 'post',
        'post_status'  => 'publish',
        'post_title'   => $data['title'],
        'post_name'    => $data['slug'],
        'post_content' => $data['content'],
        'post_excerpt' => $data['excerpt'] ?? '',
        'post_date'    => $data['date'] ?? '',
        'post_author'  => 1,
    ], true );

    if ( is_wp_error( $id ) ) WP_CLI::error( $id->get_error_message() );

    if ( ! empty( $data['categories'] ) ) {
        wp_set_post_categories( $id, $data['categories'] );
    }

    if ( ! empty( $data['tags'] ) ) {
        wp_set_post_tags( $id, array_map( fn( $t ) => get_term( $t, 'post_tag' )->name, $data['tags'] ) );
    }

    $img_id = ea_create_placeholder_image( $data['title'], $data['color'] ?? '#4a90d9' );
    if ( $img_id ) {
        set_post_thumbnail( $id, $img_id );
    }

    WP_CLI::log( "  created: {$data['title']} (ID {$id})" );
    return (int) $id;
}

// - categories --------------------------------

$cat_tech     = ea_get_or_create_category( 'Technology', 'technology' );
$cat_design   = ea_get_or_create_category( 'Design', 'design' );
$cat_business = ea_get_or_create_category( 'Business', 'business' );
$cat_lifestyle = ea_get_or_create_category( 'Lifestyle', 'lifestyle' );

// - tags -----------------------------------

$tag_tutorial = ea_get_or_create_tag( 'Tutorial', 'tutorial' );
$tag_tips     = ea_get_or_create_tag( 'Tips', 'tips' );
$tag_news     = ea_get_or_create_tag( 'News', 'news' );
$tag_review   = ea_get_or_create_tag( 'Review', 'review' );

// - posts -----------------------------------

$lorem = 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.';

$posts = [
    [
        'title'      => 'Getting Started with Web Design',
        'slug'       => 'ea-sample-getting-started-web-design',
        'excerpt'    => 'A beginner\'s guide to modern web design principles.',
        'content'    => "<p>{$lorem}</p><p>{$lorem}</p>",
        'date'       => '2025-01-15 10:00:00',
        'categories' => [ $cat_design ],
        'tags'       => [ $tag_tutorial ],
        'color'      => '#7b68ee',
    ],
    [
        'title'      => 'Top 10 UI Trends in 2025',
        'slug'       => 'ea-sample-ui-trends-2025',
        'excerpt'    => 'Explore the most impactful UI design trends shaping the web.',
        'content'    => "<p>{$lorem}</p><p>{$lorem}</p>",
        'date'       => '2025-01-22 09:00:00',
        'categories' => [ $cat_design ],
        'tags'       => [ $tag_tips, $tag_news ],
        'color'      => '#9b59b6',
    ],
    [
        'title'      => 'How to Build a REST API with Node.js',
        'slug'       => 'ea-sample-rest-api-nodejs',
        'excerpt'    => 'Step by step guide to creating a production-ready REST API.',
        'content'    => "<p>{$lorem}</p><p>{$lorem}</p>",
        'date'       => '2025-02-03 11:00:00',
        'categories' => [ $cat_tech ],
        'tags'       => [ $tag_tutorial ],
        'color'      => '#2980b9',
    ],
    [
        'title'      => 'Understanding JavaScript Promises',
        'slug'       => 'ea-sample-javascript-promises',
        'excerpt'    => 'Deep dive into async programming with JavaScript Promises.',
        'content'    => "<p>{$lorem}</p><p>{$lorem}</p>",
        'date'       => '2025-02-10 14:00:00',
        'categories' => [ $cat_tech ],
        'tags'       => [ $tag_tutorial, $tag_tips ],
        'color'      => '#16a085',
    ],
    [
        'title'      => 'The Future of Artificial Intelligence',
        'slug'       => 'ea-sample-future-of-ai',
        'excerpt'    => 'How AI is transforming industries across the globe.',
        'content'    => "<p>{$lorem}</p><p>{$lorem}</p>",
        'date'       => '2025-02-18 08:00:00',
        'categories' => [ $cat_tech ],
        'tags'       => [ $tag_news ],
        'color'      => '#1abc9c',
    ],
    [
        'title'      => 'Building a Successful Online Business',
        'slug'       => 'ea-sample-online-business',
        'excerpt'    => 'Key strategies for launching and scaling your online business.',
        'content'    => "<p>{$lorem}</p><p>{$lorem}</p>",
        'date'       => '2025-03-01 10:00:00',
        'categories' => [ $cat_business ],
        'tags'       => [ $tag_tips ],
        'color'      => '#e67e22',
    ],
    [
        'title'      => 'Email Marketing Best Practices',
        'slug'       => 'ea-sample-email-marketing',
        'excerpt'    => 'Proven strategies to increase open rates and conversions.',
        'content'    => "<p>{$lorem}</p><p>{$lorem}</p>",
        'date'       => '2025-03-08 09:30:00',
        'categories' => [ $cat_business ],
        'tags'       => [ $tag_tips, $tag_tutorial ],
        'color'      => '#d35400',
    ],
    [
        'title'      => 'Productivity Hacks for Remote Workers',
        'slug'       => 'ea-sample-productivity-remote',
        'excerpt'    => 'Stay focused and efficient while working from home.',
        'content'    => "<p>{$lorem}</p><p>{$lorem}</p>",
        'date'       => '2025-03-15 12:00:00',
        'categories' => [ $cat_lifestyle ],
        'tags'       => [ $tag_tips ],
        'color'      => '#27ae60',
    ],
    [
        'title'      => 'Review: Best Standing Desks of 2025',
        'slug'       => 'ea-sample-standing-desks-review',
        'excerpt'    => 'We tested 10 standing desks so you don\'t have to.',
        'content'    => "<p>{$lorem}</p><p>{$lorem}</p>",
        'date'       => '2025-03-22 11:00:00',
        'categories' => [ $cat_lifestyle ],
        'tags'       => [ $tag_review ],
        'color'      => '#2ecc71',
    ],
    [
        'title'      => 'Mindfulness and Mental Health at Work',
        'slug'       => 'ea-sample-mindfulness-work',
        'excerpt'    => 'Simple mindfulness practices to reduce workplace stress.',
        'content'    => "<p>{$lorem}</p><p>{$lorem}</p>",
        'date'       => '2025-04-01 10:00:00',
        'categories' => [ $cat_lifestyle ],
        'tags'       => [ $tag_tips, $tag_news ],
        'color'      => '#3498db',
    ],
    [
        'title'      => 'CSS Grid vs Flexbox: When to Use Which',
        'slug'       => 'ea-sample-css-grid-vs-flexbox',
        'excerpt'    => 'A practical comparison to help you choose the right layout tool.',
        'content'    => "<p>{$lorem}</p><p>{$lorem}</p>",
        'date'       => '2025-04-08 09:00:00',
        'categories' => [ $cat_design, $cat_tech ],
        'tags'       => [ $tag_tutorial ],
        'color'      => '#8e44ad',
    ],
    [
        'title'      => 'E-Commerce Growth Strategies for 2025',
        'slug'       => 'ea-sample-ecommerce-growth',
        'excerpt'    => 'Actionable strategies to grow your online store this year.',
        'content'    => "<p>{$lorem}</p><p>{$lorem}</p>",
        'date'       => '2025-04-15 10:00:00',
        'categories' => [ $cat_business ],
        'tags'       => [ $tag_news, $tag_tips ],
        'color'      => '#c0392b',
    ],
];

$created = 0;
foreach ( $posts as $post_data ) {
    ea_create_post( $post_data );
    $created++;
}

WP_CLI::success( "Sample posts ready → {$created} posts seeded." );
