import { Injectable } from '@angular/core';
import {
  ApiService,
  Customer,
  CustomerPayload,
  Order,
  OrderPayload,
  Product,
  ProductPayload,
} from './api.service';

export type CrudEntity = 'products' | 'customers' | 'orders';
export type CrudPayload = ProductPayload | CustomerPayload | OrderPayload;
export type OfflineAction = 'create' | 'update' | 'delete';

export interface OfflineOperation {
  offlineId: string;
  entity: CrudEntity;
  action: OfflineAction;
  payload?: CrudPayload;
  serverId?: number;
  createdAt: number;
}

export type OfflineProduct = Product & { offlineId?: string; offlineStatus?: 'offline'; offlineAction?: OfflineAction };
export type OfflineCustomer = Customer & { offlineId?: string; offlineStatus?: 'offline'; offlineAction?: OfflineAction };
export type OfflineOrder = Order & { offlineId?: string; offlineStatus?: 'offline'; offlineAction?: OfflineAction };

@Injectable({
  providedIn: 'root',
})
export class OfflineCrudService {
  private readonly storageKey = 'crud_app_offline_operations';

  constructor(private apiService: ApiService) {}

  getPendingCount(entity?: CrudEntity): number {
    return this.getOperations(entity).length;
  }

  getOperations(entity?: CrudEntity): OfflineOperation[] {
    const operations = this.readOperations();
    return entity ? operations.filter((operation) => operation.entity === entity) : operations;
  }

  enqueueCreate(entity: CrudEntity, payload: CrudPayload): OfflineOperation {
    const operation: OfflineOperation = {
      offlineId: `${entity}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      entity,
      action: 'create',
      payload,
      createdAt: Date.now(),
    };

    this.saveOperations([operation, ...this.readOperations()]);
    return operation;
  }

  enqueueUpdate(entity: CrudEntity, serverId: number, payload: CrudPayload) {
    const operations = this.readOperations();
    const existingCreate = operations.find((operation) =>
      operation.entity === entity &&
      operation.action === 'create' &&
      operation.offlineId === String(serverId)
    );

    if (existingCreate) {
      existingCreate.payload = payload;
      this.saveOperations(operations);
      return existingCreate;
    }

    const existingUpdate = operations.find((operation) =>
      operation.entity === entity &&
      operation.action === 'update' &&
      operation.serverId === serverId
    );

    if (existingUpdate) {
      existingUpdate.payload = payload;
      existingUpdate.createdAt = Date.now();
      this.saveOperations(operations);
      return existingUpdate;
    }

    const operation: OfflineOperation = {
      offlineId: `${entity}-update-${serverId}`,
      entity,
      action: 'update',
      serverId,
      payload,
      createdAt: Date.now(),
    };

    this.saveOperations([operation, ...operations]);
    return operation;
  }

  enqueueDelete(entity: CrudEntity, serverId: number) {
    const operations = this.readOperations();
    const withoutRelatedOperations = operations.filter((operation) =>
      !(operation.entity === entity && operation.serverId === serverId)
    );

    const operation: OfflineOperation = {
      offlineId: `${entity}-delete-${serverId}`,
      entity,
      action: 'delete',
      serverId,
      createdAt: Date.now(),
    };

    this.saveOperations([operation, ...withoutRelatedOperations]);
  }

  removeOfflineCreate(offlineId: string) {
    this.saveOperations(
      this.readOperations().filter((operation) => operation.offlineId !== offlineId)
    );
  }

  updateOfflineCreate(offlineId: string, payload: CrudPayload) {
    const operations = this.readOperations();
    const operation = operations.find((item) => item.offlineId === offlineId);

    if (operation && operation.action === 'create') {
      operation.payload = payload;
      operation.createdAt = Date.now();
      this.saveOperations(operations);
    }
  }

  mergeProducts(products: Product[]): OfflineProduct[] {
    return this.mergeEntityProducts(products, this.getOperations('products'));
  }

  mergeCustomers(customers: Customer[]): OfflineCustomer[] {
    return this.mergeEntityCustomers(customers, this.getOperations('customers'));
  }

  mergeOrders(orders: Order[]): OfflineOrder[] {
    return this.mergeEntityOrders(orders, this.getOperations('orders'));
  }

  async syncPendingOperations(): Promise<number> {
    const operations = this.readOperations().sort((a, b) => a.createdAt - b.createdAt);
    let syncedCount = 0;

    for (const operation of operations) {
      try {
        await this.syncOperation(operation);
        this.saveOperations(
          this.readOperations().filter((item) => item.offlineId !== operation.offlineId)
        );
        syncedCount += 1;
      } catch {
        break;
      }
    }

    return syncedCount;
  }

  private async syncOperation(operation: OfflineOperation) {
    if (operation.entity === 'products') {
      await this.syncProductsOperation(operation);
      return;
    }

    if (operation.entity === 'customers') {
      await this.syncCustomersOperation(operation);
      return;
    }

    await this.syncOrdersOperation(operation);
  }

  private async syncProductsOperation(operation: OfflineOperation) {
    if (operation.action === 'create') {
      await this.apiService.createProduct(operation.payload as ProductPayload);
    } else if (operation.action === 'update' && operation.serverId) {
      await this.apiService.updateProduct(operation.serverId, operation.payload as ProductPayload);
    } else if (operation.action === 'delete' && operation.serverId) {
      await this.apiService.deleteProduct(operation.serverId);
    }
  }

  private async syncCustomersOperation(operation: OfflineOperation) {
    if (operation.action === 'create') {
      await this.apiService.createCustomer(operation.payload as CustomerPayload);
    } else if (operation.action === 'update' && operation.serverId) {
      await this.apiService.updateCustomer(operation.serverId, operation.payload as CustomerPayload);
    } else if (operation.action === 'delete' && operation.serverId) {
      await this.apiService.deleteCustomer(operation.serverId);
    }
  }

  private async syncOrdersOperation(operation: OfflineOperation) {
    if (operation.action === 'create') {
      await this.apiService.createOrder(operation.payload as OrderPayload);
    } else if (operation.action === 'update' && operation.serverId) {
      await this.apiService.updateOrder(operation.serverId, operation.payload as OrderPayload);
    } else if (operation.action === 'delete' && operation.serverId) {
      await this.apiService.deleteOrder(operation.serverId);
    }
  }

  private mergeEntityProducts(products: Product[], operations: OfflineOperation[]): OfflineProduct[] {
    const deletedIds = new Set(operations.filter((item) => item.action === 'delete').map((item) => item.serverId));
    const merged = products
      .filter((product) => !deletedIds.has(product.id))
      .map((product) => {
        const update = operations.find((item) => item.action === 'update' && item.serverId === product.id);
        return update?.payload
          ? { ...product, ...update.payload, offlineId: update.offlineId, offlineStatus: 'offline' as const, offlineAction: update.action }
          : product;
      });

    return [
      ...operations
        .filter((item) => item.action === 'create' && item.payload)
        .map((item) => ({ id: this.getOfflineNumericId(item), ...(item.payload as ProductPayload), offlineId: item.offlineId, offlineStatus: 'offline' as const, offlineAction: item.action })),
      ...merged,
    ];
  }

  private mergeEntityCustomers(customers: Customer[], operations: OfflineOperation[]): OfflineCustomer[] {
    const deletedIds = new Set(operations.filter((item) => item.action === 'delete').map((item) => item.serverId));
    const merged = customers
      .filter((customer) => !deletedIds.has(customer.id))
      .map((customer) => {
        const update = operations.find((item) => item.action === 'update' && item.serverId === customer.id);
        return update?.payload
          ? { ...customer, ...update.payload, offlineId: update.offlineId, offlineStatus: 'offline' as const, offlineAction: update.action }
          : customer;
      });

    return [
      ...operations
        .filter((item) => item.action === 'create' && item.payload)
        .map((item) => ({ id: this.getOfflineNumericId(item), ...(item.payload as CustomerPayload), offlineId: item.offlineId, offlineStatus: 'offline' as const, offlineAction: item.action })),
      ...merged,
    ];
  }

  private mergeEntityOrders(orders: Order[], operations: OfflineOperation[]): OfflineOrder[] {
    const deletedIds = new Set(operations.filter((item) => item.action === 'delete').map((item) => item.serverId));
    const merged = orders
      .filter((order) => !deletedIds.has(order.id))
      .map((order) => {
        const update = operations.find((item) => item.action === 'update' && item.serverId === order.id);
        return update?.payload
          ? { ...order, ...update.payload, offlineId: update.offlineId, offlineStatus: 'offline' as const, offlineAction: update.action }
          : order;
      });

    return [
      ...operations
        .filter((item) => item.action === 'create' && item.payload)
        .map((item) => ({ id: this.getOfflineNumericId(item), ...(item.payload as OrderPayload), offlineId: item.offlineId, offlineStatus: 'offline' as const, offlineAction: item.action })),
      ...merged,
    ];
  }

  private getOfflineNumericId(operation: OfflineOperation): number {
    return -Math.abs(operation.createdAt);
  }

  private readOperations(): OfflineOperation[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveOperations(operations: OfflineOperation[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(operations));
  }
}
