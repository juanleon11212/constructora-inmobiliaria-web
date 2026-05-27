IF OBJECT_ID(N'[dbo].[orden_compra]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[orden_compra] (
        [id_orden] INT NOT NULL IDENTITY(1,1),
        [numero_orden] VARCHAR(30) NOT NULL,
        [fecha_orden] DATE NOT NULL,
        [total_estimado] DECIMAL(12,2) NOT NULL CONSTRAINT [df_orden_total] DEFAULT 0,
        [estado] VARCHAR(30) NOT NULL CONSTRAINT [df_orden_estado] DEFAULT 'solicitada',
        [observacion] VARCHAR(200),
        [id_proveedor] INT NOT NULL,
        [id_proyecto] INT NOT NULL,
        [id_almacen] INT NOT NULL,
        [id_usuario_registro] INT,
        CONSTRAINT [PK_orden_compra] PRIMARY KEY CLUSTERED ([id_orden]),
        CONSTRAINT [uq_orden_numero] UNIQUE NONCLUSTERED ([numero_orden])
    );
END;

IF OBJECT_ID(N'[dbo].[detalle_orden_compra]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[detalle_orden_compra] (
        [id_detalle_orden] INT NOT NULL IDENTITY(1,1),
        [cantidad] DECIMAL(10,2) NOT NULL,
        [precio_unitario] DECIMAL(10,2) NOT NULL,
        [subtotal] DECIMAL(12,2) NOT NULL,
        [id_orden] INT NOT NULL,
        [id_material] INT NOT NULL,
        CONSTRAINT [PK_detalle_orden] PRIMARY KEY CLUSTERED ([id_detalle_orden])
    );
END;

IF COL_LENGTH(N'[dbo].[compra_material]', N'id_orden') IS NULL
BEGIN
    ALTER TABLE [dbo].[compra_material] ADD [id_orden] INT;
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'uq_compra_orden' AND object_id = OBJECT_ID(N'[dbo].[compra_material]'))
BEGIN
    EXEC(N'CREATE UNIQUE NONCLUSTERED INDEX [uq_compra_orden] ON [dbo].[compra_material]([id_orden]) WHERE [id_orden] IS NOT NULL;');
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_orden_fecha_proyecto' AND object_id = OBJECT_ID(N'[dbo].[orden_compra]'))
BEGIN
    EXEC(N'CREATE NONCLUSTERED INDEX [idx_orden_fecha_proyecto] ON [dbo].[orden_compra]([fecha_orden], [id_proyecto]);');
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_detalle_orden_material' AND object_id = OBJECT_ID(N'[dbo].[detalle_orden_compra]'))
BEGIN
    EXEC(N'CREATE NONCLUSTERED INDEX [idx_detalle_orden_material] ON [dbo].[detalle_orden_compra]([id_material]);');
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_orden_proveedor')
    EXEC(N'ALTER TABLE [dbo].[orden_compra] ADD CONSTRAINT [fk_orden_proveedor] FOREIGN KEY ([id_proveedor]) REFERENCES [dbo].[proveedor]([id_proveedor]);');

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_orden_proyecto')
    EXEC(N'ALTER TABLE [dbo].[orden_compra] ADD CONSTRAINT [fk_orden_proyecto] FOREIGN KEY ([id_proyecto]) REFERENCES [dbo].[proyecto]([id_proyecto]);');

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_orden_almacen')
    EXEC(N'ALTER TABLE [dbo].[orden_compra] ADD CONSTRAINT [fk_orden_almacen] FOREIGN KEY ([id_almacen]) REFERENCES [dbo].[almacen]([id_almacen]);');

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_orden_usuario')
    EXEC(N'ALTER TABLE [dbo].[orden_compra] ADD CONSTRAINT [fk_orden_usuario] FOREIGN KEY ([id_usuario_registro]) REFERENCES [dbo].[usuario]([id_usuario]);');

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_detalle_orden')
    EXEC(N'ALTER TABLE [dbo].[detalle_orden_compra] ADD CONSTRAINT [fk_detalle_orden] FOREIGN KEY ([id_orden]) REFERENCES [dbo].[orden_compra]([id_orden]);');

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_detalle_orden_material')
    EXEC(N'ALTER TABLE [dbo].[detalle_orden_compra] ADD CONSTRAINT [fk_detalle_orden_material] FOREIGN KEY ([id_material]) REFERENCES [dbo].[material]([id_material]);');

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_compra_orden')
    EXEC(N'ALTER TABLE [dbo].[compra_material] ADD CONSTRAINT [fk_compra_orden] FOREIGN KEY ([id_orden]) REFERENCES [dbo].[orden_compra]([id_orden]);');
