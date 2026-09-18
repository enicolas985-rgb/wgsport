import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const initialState = {
  items: JSON.parse(localStorage.getItem('cart')) || [],
  isDrawerOpen: false,
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.id === action.payload.id && item.size === action.payload.size && item.color === action.payload.color
      );

      let newItems;
      if (existingItemIndex >= 0) {
        newItems = [...state.items];
        newItems[existingItemIndex].quantity += action.payload.quantity;
      } else {
        newItems = [...state.items, action.payload];
      }
      return { ...state, items: newItems, isDrawerOpen: true };
    }
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(
        item => !(item.id === action.payload.id && item.size === action.payload.size && item.color === action.payload.color)
      );
      return { ...state, items: newItems };
    }
    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item => {
        if (item.id === action.payload.id && item.size === action.payload.size && item.color === action.payload.color) {
          return { ...item, quantity: action.payload.quantity };
        }
        return item;
      });
      return { ...state, items: newItems };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'TOGGLE_DRAWER':
      return { ...state, isDrawerOpen: action.payload !== undefined ? action.payload : !state.isDrawerOpen };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const getCartTotal = () => {
    return state.items.reduce((total, item) => {
      const price = item.discounted_price || item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const generateWhatsAppURL = (customerInfo, whatsappNumber) => {
    let message = `🛒 *Nuevo Pedido — WG*\n\n📋 *Productos:*\n`;
    
    state.items.forEach(item => {
      const price = item.discounted_price || item.price;
      message += `• ${item.quantity}x ${item.name} (Talla: ${item.size}, Color: ${item.color}) — $${price}\n`;
    });

    message += `\n💰 *Total: $${getCartTotal()}*\n\n`;
    message += `👤 *Cliente:* ${customerInfo.name}\n`;
    message += `📱 *Teléfono:* ${customerInfo.phone}\n`;
    
    if (customerInfo.notes) {
      message += `\n📝 *Notas/Dirección:* ${customerInfo.notes}`;
    }

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
  };

  return (
    <CartContext.Provider value={{
      items: state.items,
      isDrawerOpen: state.isDrawerOpen,
      dispatch,
      getCartTotal,
      getCartCount,
      generateWhatsAppURL
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
