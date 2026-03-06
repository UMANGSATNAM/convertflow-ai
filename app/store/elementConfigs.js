// Default configurations for all draggable elements in the Page Builder

export const ELEMENT_CONFIGS = {
    Row: {
        type: 'Row',
        label: 'Row',
        icon: 'Layout',
        isContainer: true,
        acceptsChildren: true,
        defaultProps: {
            styles: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 0',
                gap: '20px',
                width: '100%',
                flexWrap: 'wrap',
                backgroundColor: 'transparent'
            }
        }
    },
    Column: {
        type: 'Column',
        label: 'Column',
        icon: 'Columns',
        isContainer: true,
        acceptsChildren: true,
        defaultProps: {
            styles: {
                display: 'flex',
                flexDirection: 'column',
                flex: '1',
                padding: '10px',
                gap: '10px',
                minWidth: '250px',
                backgroundColor: 'transparent'
            }
        }
    },
    Heading: {
        type: 'Heading',
        label: 'Heading',
        icon: 'Type',
        isContainer: false,
        acceptsChildren: false,
        defaultProps: {
            tag: 'h2',
            text: 'Heading Text',
            styles: {
                fontSize: '32px',
                fontWeight: '700',
                color: '#111827',
                margin: '0',
                textAlign: 'left'
            }
        }
    },
    Paragraph: {
        type: 'Paragraph',
        label: 'Paragraph',
        icon: 'AlignLeft',
        isContainer: false,
        acceptsChildren: false,
        defaultProps: {
            text: 'Enter your paragraph text here. You can customize the font, color, and size in the settings panel on the right.',
            styles: {
                fontSize: '16px',
                fontWeight: '400',
                color: '#4B5563',
                lineHeight: '1.5',
                margin: '0',
                textAlign: 'left'
            }
        }
    },
    Button: {
        type: 'Button',
        label: 'Button',
        icon: 'MousePointerClick',
        isContainer: false,
        acceptsChildren: false,
        defaultProps: {
            text: 'Click Here',
            url: '#',
            styles: {
                display: 'inline-block',
                backgroundColor: '#000000',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                textAlign: 'center',
                border: 'none',
                cursor: 'pointer'
            }
        }
    },
    Image: {
        type: 'Image',
        label: 'Image',
        icon: 'Image as ImageIcon', // Alias to avoid built in Image object collision in imports later
        isContainer: false,
        acceptsChildren: false,
        defaultProps: {
            src: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png',
            alt: 'Placeholder image',
            styles: {
                width: '100%',
                maxWidth: '600px',
                height: 'auto',
                borderRadius: '0px',
                objectFit: 'cover'
            }
        }
    },
    Spacer: {
        type: 'Spacer',
        label: 'Spacer',
        icon: 'Space',
        isContainer: false,
        acceptsChildren: false,
        defaultProps: {
            styles: {
                height: '50px',
                width: '100%'
            }
        }
    },
    Divider: {
        type: 'Divider',
        label: 'Divider',
        icon: 'Minus',
        isContainer: false,
        acceptsChildren: false,
        defaultProps: {
            styles: {
                height: '1px',
                width: '100%',
                backgroundColor: '#E5E7EB',
                margin: '20px 0'
            }
        }
    }
};
