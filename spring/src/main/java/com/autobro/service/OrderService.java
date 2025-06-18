package com.autobro.service;

import com.autobro.dto.OrderDTO;
import com.autobro.model.Order;
import com.autobro.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    @Autowired
    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional
    public Order createOrder(OrderDTO orderDTO) {
        Order order = new Order();
        order.setFullName(orderDTO.getFullName());
        order.setPhone(orderDTO.getPhone());
        order.setEmail(orderDTO.getEmail());
        order.setCarId(orderDTO.getCarId());
        order.setCarMake(orderDTO.getCarMake());
        order.setCarModel(orderDTO.getCarModel());
        order.setCarYear(orderDTO.getCarYear());
        order.setCarPrice(orderDTO.getCarPrice());
        order.setStatus("NEW");
        
        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Заказ с ID " + id + " не найден"));
    }

    @Transactional
    public Order updateOrderStatus(Long id, String status) {
        Order order = getOrderById(id);
        order.setStatus(status);
        return orderRepository.save(order);
    }
}
