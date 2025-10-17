# Generated migration for UI Elements

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Element',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255, unique=True)),
                ('type', models.CharField(choices=[('logo', 'Logo'), ('icon', 'Icon'), ('decorative', 'Decorative'), ('svg', 'SVG'), ('image', 'Image')], max_length=20)),
                ('description', models.TextField(blank=True, null=True)),
                ('svg_content', models.TextField(blank=True, help_text='SVG markup', null=True)),
                ('image_url', models.URLField(blank=True, help_text='Image URL or path', null=True)),
                ('width', models.IntegerField(help_text='Width in pixels')),
                ('height', models.IntegerField(help_text='Height in pixels')),
                ('primary_color', models.CharField(blank=True, help_text='Hex color code', max_length=7, null=True)),
                ('secondary_color', models.CharField(blank=True, help_text='Hex color code', max_length=7, null=True)),
                ('location', models.CharField(blank=True, help_text="Where it's used (e.g., 'sidebar.logo')", max_length=255, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'UI Element',
                'verbose_name_plural': 'UI Elements',
                'db_table': 'elements',
                'ordering': ['-created_at'],
            },
        ),
    ]

